# Histórico antes de sobrescrever Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Antes de sobrescrever uma campanha, o Worker guarda a versão anterior em `historico/<nome>/<data ISO>.json` e mantém só as 20 cópias mais recentes daquela campanha (issue #34).

**Architecture:** Tudo mora em `worker/index.js`. Antes do `put` da campanha, uma função `keepPrevious` lê a versão atual; se ela existe, grava a cópia no histórico e apaga as cópias além das 20 mais novas, listando só o prefixo `historico/<nome>/`. A data ISO no nome ordena as cópias em ordem alfabética = ordem de tempo. O fake `memoryBucket` ganha `list` e `delete`, no formato do R2.

**Tech Stack:** Cloudflare Worker (R2 binding `CAMPAIGNS`), Vitest.

**Spec:** issue #34 (pai: #32, `docs/superpowers/specs/2026-10-06-publicar-pelo-app-design.md`)

## Global Constraints

- Caminho da cópia: `historico/<nome>/<data ISO>.json`, onde `<nome>` é o nome do arquivo sem `.json` (ex.: `noites.json` → `historico/noites/2026-10-07T21:30:00.000Z.json`). Data de `new Date().toISOString()`.
- Limite: `HISTORY_LIMIT = 20` cópias por campanha.
- A primeira publicação de uma campanha nova não cria cópia.
- Publicar uma campanha nunca mexe nas outras campanhas nem no histórico delas.
- Ordem no Worker (spec): checagens (401, 400, 413, 400) → cópia + limpeza do histórico → grava `<nome>.json` → `200`.
- Testes só pelo `worker.fetch(request, env)` com bucket em memória (`memoryBucket` de `src/test/fakes.js`).
- Sem comentários no código. Commits em Conventional Commits, em inglês, só a linha de título, com `git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "..."`. Sem `Co-Authored-By`.
- O gate de qualidade `fallow` roda no commit: funções curtas, sem helpers de teste duplicados.

## Review Focus

1. Campanhas com nomes que começam igual (`noites` e `noites-2`): limpar o histórico de `noites` não apaga nada de `noites-2`. O prefixo precisa terminar em `/`. Teste na Task 2.
2. Publicação recusada (senha errada, nome inválido, corpo grande, corpo não-JSON) por cima de uma campanha existente: não cria cópia. Teste na Task 1.
3. Menos de 20 cópias: nada é apagado. Teste na Task 2.
4. Falha ao gravar a cópia: responde `500` e a campanha antiga continua lá (nunca sobrescreve sem guardar a cópia). Teste na Task 1.
5. A cópia guarda `Content-Type: application/json`, para abrir certo ao baixar pelo painel do R2. Teste na Task 1.

---

### Task 1: Copiar a versão anterior para o histórico

**Files:**
- Modify: `worker/index.js`
- Test: `worker/index.test.js`

**Interfaces:**
- Consumes: `memoryBucket(initial)` de `src/test/fakes.js` (`put`, `get`, `keys`), `setup(objects)` e `publish(env, name, options)` do próprio arquivo de teste.
- Produces: em `worker/index.js`, `historyPrefix(name)` → `'historico/<nome>/'` e `keepPrevious(bucket, name)` (async). A Task 2 estende `keepPrevious`.

- [ ] **Step 1: Write the failing tests**

Em `worker/index.test.js`, troque o import do Vitest para incluir `afterEach` e `beforeEach`:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
```

Adicione este bloco antes de `describe('Routes of the app', ...)`:

```js
describe('History before overwriting', () => {
  const NOW = '2026-10-07T21:30:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => vi.useRealTimers())

  it('copies the previous version into the campaign history, dated, before replacing it', async () => {
    const env = setup({ 'noites.json': '{"old":true}' })

    const response = await publish(env, 'noites.json')

    expect(response.status).toBe(200)
    const copy = await env.CAMPAIGNS.get(`historico/noites/${NOW}.json`)
    expect(await copy.text()).toBe('{"old":true}')
    expect(copy.httpMetadata.contentType).toBe('application/json')
    expect(await (await env.CAMPAIGNS.get('noites.json')).text()).toBe(CAMPAIGN)
  })

  it('creates no copy on the first publish of a new campaign', async () => {
    const env = setup()

    await publish(env, 'noites.json')

    expect(env.CAMPAIGNS.keys()).toEqual(['noites.json'])
  })

  it.each([
    ['a wrong password', { token: 'chute' }],
    ['a body that is not JSON', { body: '<html>' }],
    ['a body above 1 MB', { body: JSON.stringify({ notes: 'x'.repeat(1024 * 1024) }) }],
  ])('creates no copy when publishing is refused for %s', async (_, options) => {
    const env = setup({ 'noites.json': '{"old":true}' })

    await publish(env, 'noites.json', options)

    expect(env.CAMPAIGNS.keys()).toEqual(['noites.json'])
  })

  it('keeps the old campaign when the copy cannot be stored', async () => {
    const env = setup({ 'noites.json': '{"old":true}' })
    const put = env.CAMPAIGNS.put
    env.CAMPAIGNS.put = async (key, ...rest) => {
      if (key.startsWith('historico/')) throw new Error('falhou')
      return put(key, ...rest)
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await publish(env, 'noites.json')

    expect(response.status).toBe(500)
    expect(await (await env.CAMPAIGNS.get('noites.json')).text()).toBe('{"old":true}')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run worker/index.test.js`
Expected: FAIL em "copies the previous version..." (`copy` é `null`) e em "keeps the old campaign..." (status `200`, campanha trocada). Os outros novos já passam; tudo bem, eles protegem contra regressão.

- [ ] **Step 3: Write minimal implementation**

Em `worker/index.js`, adicione depois de `isJson`:

```js
function historyPrefix(name) {
  return `historico/${name.slice(0, -'.json'.length)}/`
}

async function keepPrevious(bucket, name) {
  const previous = await bucket.get(name)
  if (!previous) return
  const copy = `${historyPrefix(name)}${new Date().toISOString()}.json`
  await bucket.put(copy, await previous.text(), { httpMetadata: { contentType: 'application/json' } })
}
```

Em `publishCampaign`, logo antes do `await env.CAMPAIGNS.put(name, ...)`:

```js
  await keepPrevious(env.CAMPAIGNS, name)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run worker/index.test.js`
Expected: PASS (todos, incluindo os antigos).

- [ ] **Step 5: Commit**

```bash
git add worker/index.js worker/index.test.js
git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "feat: keep the previous campaign in history before overwriting"
```

---

### Task 2: Manter só as 20 cópias mais recentes

**Files:**
- Modify: `src/test/fakes.js` (`memoryBucket`)
- Modify: `worker/index.js`
- Test: `worker/index.test.js`

**Interfaces:**
- Consumes: `historyPrefix(name)` e `keepPrevious(bucket, name)` da Task 1; bloco `describe('History before overwriting')` da Task 1 (com `NOW` e o relógio falso).
- Produces: `memoryBucket` ganha `list({ prefix })` → `{ objects: [{ key }], truncated: false }` e `delete(keyOrKeys)`, no formato do R2. Em `worker/index.js`, `HISTORY_LIMIT = 20` e `pruneHistory(bucket, prefix)` (async).

- [ ] **Step 1: Write the failing tests**

No topo de `worker/index.test.js`, depois de `setup`, adicione:

```js
function historyOf(campaign, count) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [
      `historico/${campaign}/2026-09-${String(index + 1).padStart(2, '0')}T00:00:00.000Z.json`,
      `{"version":${index}}`,
    ]),
  )
}

function historyKeys(env, campaign) {
  return env.CAMPAIGNS.keys().filter((key) => key.startsWith(`historico/${campaign}/`))
}
```

Dentro de `describe('History before overwriting', ...)`, adicione:

```js
  it('keeps only the 20 newest copies of the campaign', async () => {
    const env = setup({ 'noites.json': '{"old":true}', ...historyOf('noites', 20) })

    await publish(env, 'noites.json')

    const keys = historyKeys(env, 'noites')
    expect(keys).toHaveLength(20)
    expect(keys).not.toContain('historico/noites/2026-09-01T00:00:00.000Z.json')
    expect(keys).toContain('historico/noites/2026-09-02T00:00:00.000Z.json')
    expect(keys).toContain(`historico/noites/${NOW}.json`)
  })

  it('deletes nothing while the campaign has fewer than 20 copies', async () => {
    const env = setup({ 'noites.json': '{"old":true}', ...historyOf('noites', 5) })

    await publish(env, 'noites.json')

    expect(historyKeys(env, 'noites')).toHaveLength(6)
  })

  it('never touches another campaign or its history, even with a name that starts the same', async () => {
    const other = { 'noites-2.json': '{"other":true}', ...historyOf('noites-2', 20) }
    const env = setup({ 'noites.json': '{"old":true}', ...historyOf('noites', 20), ...other })

    await publish(env, 'noites.json')

    for (const [key, body] of Object.entries(other)) {
      expect(await (await env.CAMPAIGNS.get(key)).text()).toBe(body)
    }
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run worker/index.test.js`
Expected: FAIL em "keeps only the 20 newest copies" (21 cópias). Os outros dois passam; eles protegem a limpeza que vem a seguir.

- [ ] **Step 3: Give the fake bucket `list` and `delete`**

Em `src/test/fakes.js`, dentro do objeto retornado por `memoryBucket`, depois de `get`:

```js
    async list({ prefix = '' } = {}) {
      const keys = [...objects.keys()].filter((key) => key.startsWith(prefix))
      return { objects: keys.map((key) => ({ key })), truncated: false }
    },
    async delete(keys) {
      for (const key of [keys].flat()) objects.delete(key)
    },
```

- [ ] **Step 4: Write minimal implementation**

Em `worker/index.js`, junto das outras constantes no topo:

```js
const HISTORY_LIMIT = 20
```

Depois de `historyPrefix`:

```js
async function pruneHistory(bucket, prefix) {
  const { objects } = await bucket.list({ prefix })
  const stale = objects.map(({ key }) => key).sort().slice(0, -HISTORY_LIMIT)
  if (stale.length > 0) await bucket.delete(stale)
}
```

No fim de `keepPrevious`, depois do `bucket.put(copy, ...)`:

```js
  await pruneHistory(bucket, historyPrefix(name))
```

Notas para quem implementa:
- `slice(0, -20)` com 20 ou menos itens devolve `[]`, então nada é apagado.
- A data ISO tem largura fixa, então `sort()` alfabético = ordem de tempo.
- O R2 lista até 1000 chaves por página. Com no máximo 21 cópias, uma página basta.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run worker/index.test.js`
Expected: PASS (todos).

- [ ] **Step 6: Run the whole suite and lint**

Run: `pnpm test && pnpm lint`
Expected: tudo passa, sem avisos.

- [ ] **Step 7: Commit**

```bash
git add src/test/fakes.js worker/index.js worker/index.test.js
git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "feat: keep only the 20 newest history copies per campaign"
```
