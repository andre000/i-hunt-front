# Publicar um Rascunho novo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Num Rascunho que não veio do bucket (em branco, do computador ou de outro endereço), a primeira publicação pede o nome do arquivo; depois o Rascunho lembra esse destino, e toda publicação mostra o link de Convite pronto para copiar (issue #36).

**Architecture:** O store do Editor ganha o passo `'name'` no fluxo de publicação. `startPublishing` pergunta o nome quando o Rascunho não tem `target`; `choosePublishName` guarda o nome escolhido em `publishName` e segue para a senha (ou publica direto, se a senha está salva). Só quando a publicação dá certo o nome vira `target`, que já é salvo junto com o Rascunho no navegador (`draftStorage`). O publicador passa a devolver a `url` da resposta do Worker, que vai para `publishedUrl` e alimenta o `InviteBox` já usado na Visão do GM.

**Tech Stack:** React 18, Redux Toolkit, Testing Library, Vitest.

**Spec:** issue #36 (pai: #32, `docs/superpowers/specs/2026-10-06-publicar-pelo-app-design.md`)

## Global Constraints

- Nome aceito pelo Worker: `^[a-z0-9-]+\.json$`. O Editor usa o mesmo padrão (`isCampaignName` em `src/campaign/publisher.js`).
- O nome é pedido num formulário dentro do Editor, nunca em `window.prompt`.
- Nome sugerido: o nome escolhido na tentativa anterior (`publishName`) ou, na primeira vez, o nome atual do arquivo (`fileName`).
- Rascunho aberto de um endereço que começa com `VITE_PUBLIC_BASE_URL`: publica no mesmo nome, sem perguntar (já entregue no #33, não pode quebrar).
- O destino (`target`) só muda depois de uma publicação com sucesso.
- Cancelar o nome não publica nada e não mexe no Rascunho nem no aviso "Mudanças não publicadas".
- Testes só pela tela, via `renderApp` com `publishFetch` falso e `editorStorage` em memória. Nada de olhar o estado do Redux.
- Textos novos: formulário `aria-label="Nome do arquivo publicado"`, campo "Nome do arquivo no bucket", botão "Continuar", aviso "Use só letras minúsculas, números e -, terminando em .json."
- Se o nome escolhido é o da campanha que os jogadores leem neste aparelho (`publisher.targetOf(campaignUrl)`), o formulário avisa "Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles." e o botão passa a se chamar "Substituir". Ainda dá para publicar.
- Sem comentários no código. Commits em Conventional Commits, em inglês, só a linha de título, com `git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "..."`. Sem `Co-Authored-By`.
- O gate de qualidade `fallow` roda no commit: funções curtas, sem helpers de teste duplicados.

## Review Focus

0. Rascunho novo com o mesmo nome da campanha dos jogadores (`campanha.json` em branco, ou um arquivo do computador com esse nome): o formulário avisa e o botão vira "Substituir". Trocar o nome tira o aviso. Teste na Task 1.
1. Nome sugerido que o Worker recusaria (`Mesa Nova.json`, vindo de um arquivo do computador): o Editor mostra o aviso e trava "Continuar" até o GM corrigir. Teste na Task 1.
2. Rascunho carregado de um endereço colado que não é do nosso bucket (`https://pub-9.r2.dev/noites.json`): pede o nome, sugerindo `noites.json`. Teste na Task 1.
3. Primeira publicação falha (500): o destino não fica salvo; o próximo clique em Publicar pede o nome de novo, já com o nome escolhido antes. Teste na Task 1.
4. Mudar o Rascunho depois de publicar: o Convite e o "Publicado." somem, para o GM não achar que a mudança nova já foi. Teste na Task 2.
5. Resposta do Worker sem `url` (ou com corpo que não é JSON): mostra "Publicado." sem Convite e não quebra. Teste na Task 2.

---

### Task 1: Pedir o nome na primeira publicação e lembrar o destino

**Files:**
- Modify: `src/campaign/publisher.js`
- Modify: `src/store/editor.js`
- Modify: `src/components/editor/PublishPanel.jsx`
- Modify: `src/routes/gm/editor.lazy.jsx:363-389` (`DraftBar`)
- Test: `src/routes/gm/editor.test.jsx`

**Interfaces:**
- Consumes: `renderApp({ path, hunterId, campaignUrl, editorStorage, publishFetch })` de `src/test/renderApp.jsx`; `memoryStorage`, `respondWith` de `src/test/fakes.js`; `TOKEN_KEY` e `publishWithPassword(password)` já definidos dentro de `describe('Publicar')`.
- Produces:
  - `isCampaignName(name: string): boolean` exportado de `src/campaign/publisher.js`.
  - Em `src/store/editor.js`: estados novos `publishName: string | null` e `publishLive: string | null` (nome do arquivo que os jogadores leem, se for do bucket); `publishing` pode valer `'name'`; action `publishNameAsked(liveName)`, `publishNameChosen(name)`; thunk `choosePublishName(name)`. `publishDraft` agora devolve `{ sent, name, url }` (a Task 2 usa `url`).
  - `publisher.publish(name, text, token)` resolve `{ url: string | null }`.

- [ ] **Step 1: Write the failing tests**

Em `src/routes/gm/editor.test.jsx`, dentro de `describe('Publicar', ...)`, depois do último `it` (`'locks the button and shows it is publishing while it waits'`), adicione:

```js
  describe('a Rascunho that is not in the bucket', () => {
    const nameForm = () => screen.getByRole('form', { name: 'Nome do arquivo publicado' })
    const nameField = () => within(nameForm()).getByLabelText('Nome do arquivo no bucket')

    async function openFromComputer(fileName, options = {}) {
      const result = await renderApp({
        path: '/gm/editor',
        hunterId: null,
        campaignUrl: null,
        editorStorage: memoryStorage({ [TOKEN_KEY]: 'guardada' }),
        ...options,
      })
      const file = new File([JSON.stringify(validCampaign())], fileName, { type: 'application/json' })
      fireEvent.change(await screen.findByLabelText('Abrir arquivo do computador'), { target: { files: [file] } })
      await screen.findByLabelText('Nome da campanha')
      return result
    }

    function publishAs(name) {
      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
      if (name) fireEvent.change(nameField(), { target: { value: name } })
      fireEvent.click(within(nameForm()).getByRole('button', { name: 'Continuar' }))
    }

    it('asks the name of a draft from the computer, filled with the file name', async () => {
      const { publishFetch } = await openFromComputer('mesa.json')

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
      expect(nameField().value).toBe('mesa.json')
      fireEvent.click(within(nameForm()).getByRole('button', { name: 'Continuar' }))

      expect(await screen.findByText('Publicado.')).toBeTruthy()
      expect(publishFetch.mock.calls[0][0]).toBe('/api/campanhas/mesa.json')
    })

    it('asks the name of a blank draft', async () => {
      const { publishFetch } = await renderApp({
        path: '/gm/editor',
        hunterId: null,
        campaignUrl: null,
        editorStorage: memoryStorage({ [TOKEN_KEY]: 'guardada' }),
      })
      fireEvent.click(await screen.findByRole('button', { name: 'Começar em branco' }))
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar hunter' }))
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } })
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
      expect(nameField().value).toBe('campanha.json')
      fireEvent.change(nameField(), { target: { value: 'noites.json' } })
      fireEvent.click(within(nameForm()).getByRole('button', { name: 'Continuar' }))

      await screen.findByText('Publicado.')
      expect(publishFetch.mock.calls[0][0]).toBe('/api/campanhas/noites.json')
    })

    it('asks the name of a draft loaded from an address outside the bucket', async () => {
      await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null })
      fireEvent.change(await screen.findByLabelText('Endereço do arquivo no R2'), { target: { value: 'https://pub-9.r2.dev/noites.json' } })
      fireEvent.click(screen.getByRole('button', { name: 'Carregar' }))
      await screen.findByLabelText('Nome da campanha')

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))

      expect(nameField().value).toBe('noites.json')
    })

    it('asks the name before the password', async () => {
      const { publishFetch } = await openFromComputer('mesa.json', { editorStorage: memoryStorage() })

      publishAs('noites.json')
      const form = screen.getByRole('form', { name: 'Senha de publicação' })
      fireEvent.change(within(form).getByLabelText('Senha de publicação'), { target: { value: 'senha-do-gm' } })
      fireEvent.click(within(form).getByRole('button', { name: 'Publicar com esta senha' }))

      expect(await screen.findByText('Publicado.')).toBeTruthy()
      expect(publishFetch.mock.calls[0][0]).toBe('/api/campanhas/noites.json')
    })

    it('sends nothing and keeps the draft when the GM cancels the name', async () => {
      const { publishFetch } = await openFromComputer('mesa.json')
      fireEvent.change(screen.getByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
      fireEvent.click(within(nameForm()).getByRole('button', { name: 'Cancelar' }))

      expect(screen.queryByRole('form', { name: 'Nome do arquivo publicado' })).toBeNull()
      expect(publishFetch).not.toHaveBeenCalled()
      expect(screen.getByLabelText('Nome da campanha').value).toBe('Noite em Pelotas')
      expect(screen.getByText('Mudanças não publicadas')).toBeTruthy()
    })

    it('publishes again under the same name without asking', async () => {
      const { publishFetch } = await openFromComputer('mesa.json')
      publishAs('noites.json')
      await screen.findByText('Publicado.')
      fireEvent.change(screen.getByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))

      await screen.findByText('Publicado.')
      expect(screen.queryByRole('form', { name: 'Nome do arquivo publicado' })).toBeNull()
      expect(publishFetch.mock.calls[1][0]).toBe('/api/campanhas/noites.json')
    })

    it('remembers the name after reloading', async () => {
      const editorStorage = memoryStorage({ [TOKEN_KEY]: 'guardada' })
      await openFromComputer('mesa.json', { editorStorage })
      publishAs('noites.json')
      await screen.findByText('Publicado.')
      cleanup()

      const { publishFetch } = await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null, editorStorage })
      fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))

      await screen.findByText('Publicado.')
      expect(publishFetch.mock.calls[0][0]).toBe('/api/campanhas/noites.json')
    })

    it('does not accept a name the bucket would refuse', async () => {
      await openFromComputer('Mesa Nova.json')

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))

      expect(nameField().value).toBe('Mesa Nova.json')
      expect(within(nameForm()).getByText('Use só letras minúsculas, números e -, terminando em .json.')).toBeTruthy()
      expect(within(nameForm()).getByRole('button', { name: 'Continuar' }).disabled).toBe(true)
      fireEvent.change(nameField(), { target: { value: 'mesa-nova.json' } })
      expect(within(nameForm()).getByRole('button', { name: 'Continuar' }).disabled).toBe(false)
    })

    it('asks the name again, with the last choice, after a failed first publish', async () => {
      await openFromComputer('mesa.json', { publishFetch: respondWith('erro', 500) })
      publishAs('noites.json')
      await screen.findByText('Não deu para publicar. O rascunho continua salvo.')

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))

      expect(nameField().value).toBe('noites.json')
    })

    it('warns before replacing the campaign the players read', async () => {
      const { publishFetch } = await renderApp({ path: '/gm/editor', hunterId: null, editorStorage: memoryStorage({ [TOKEN_KEY]: 'guardada' }) })
      fireEvent.click(await screen.findByRole('button', { name: 'Trocar rascunho' }))
      const other = validCampaign()
      other.campaign.name = 'Outra mesa'
      const file = new File([JSON.stringify(other)], 'campanha.json', { type: 'application/json' })
      fireEvent.change(screen.getByLabelText('Abrir arquivo do computador'), { target: { files: [file] } })
      fireEvent.click(screen.getByRole('button', { name: 'Substituir' }))
      await waitFor(() => expect(screen.getByLabelText('Nome da campanha').value).toBe('Outra mesa'))

      fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))

      const warning = 'Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles.'
      expect(within(nameForm()).getByText(warning)).toBeTruthy()
      fireEvent.change(nameField(), { target: { value: 'teste.json' } })
      expect(within(nameForm()).queryByText(warning)).toBeNull()
      expect(within(nameForm()).getByRole('button', { name: 'Continuar' })).toBeTruthy()
      fireEvent.change(nameField(), { target: { value: 'campanha.json' } })
      fireEvent.click(within(nameForm()).getByRole('button', { name: 'Substituir' }))

      await screen.findByText('Publicado.')
      expect(publishFetch.mock.calls[0][0]).toBe('/api/campanhas/campanha.json')
    })

    it('does not warn when the players read a campaign outside the bucket', async () => {
      await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: 'https://pub-9.r2.dev/campanha.json' })

      fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))

      expect(within(nameForm()).queryByText(/jogadores leem/)).toBeNull()
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/routes/gm/editor.test.jsx -t "not in the bucket"`
Expected: FAIL. O botão Publicar está travado (`disabled`) sem `target`, então o formulário "Nome do arquivo publicado" nunca aparece (`Unable to find role="form"`).

- [ ] **Step 3: Return the URL and share the name rule in the publisher**

Troque `src/campaign/publisher.js` inteiro por:

```js
import { attempt, safeStorage } from './storage'

const TOKEN_KEY = 'ihunt.editor.publishToken'
const CAMPAIGN_NAME = /^[a-z0-9-]+\.json$/

export const isCampaignName = (name) => CAMPAIGN_NAME.test(name)

export function createPublisher({ fetch, storage, publicBaseUrl }) {
  const store = safeStorage(storage)
  return {
    targetOf(url) {
      if (!publicBaseUrl || !url?.startsWith(`${publicBaseUrl}/`)) return null
      const name = url.slice(publicBaseUrl.length + 1)
      return isCampaignName(name) ? name : null
    },
    savedToken: () => store.get(TOKEN_KEY),
    async publish(name, text, token) {
      const response = await fetch(`/api/campanhas/${name}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: text,
      })
      if (response.status === 401) store.remove(TOKEN_KEY)
      if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
      store.set(TOKEN_KEY, token)
      const reply = attempt(JSON.parse.bind(null, await response.text()))
      return { url: typeof reply?.url === 'string' ? reply.url : null }
    },
  }
}
```

- [ ] **Step 4: Add the name step to the store**

Em `src/store/editor.js`:

Troque `publishDraft` e `startPublishing` por:

```js
export const publishDraft = createAsyncThunk(
  'editor/publish',
  async (token, { extra, getState, rejectWithValue }) => {
    const { draft, target, publishName } = getState().editor
    const name = target ?? publishName
    try {
      const { url } = await extra.publisher.publish(name, campaignFile(draft), token)
      return { sent: draft, name, url }
    } catch (error) {
      return rejectWithValue(error.status ?? null)
    }
  },
)

function askPasswordOrPublish(dispatch, publisher) {
  const token = publisher.savedToken()
  dispatch(token ? publishDraft(token) : publishPasswordAsked())
}

export function startPublishing() {
  return (dispatch, getState, { publisher }) => {
    const { editor, campaign } = getState()
    if (editor.target) askPasswordOrPublish(dispatch, publisher)
    else dispatch(publishNameAsked(publisher.targetOf(campaign.campaignUrl)))
  }
}

export function choosePublishName(name) {
  return (dispatch, _, { publisher }) => {
    dispatch(publishNameChosen(name))
    askPasswordOrPublish(dispatch, publisher)
  }
}
```

Em `initialEditorState`, adicione `publishName: null,` e `publishLive: null,` depois de `publishFailure: null,`.

Em `open(...)`, inclua `publishName: null` no `Object.assign`:

```js
function open(state, draft, fileName, target = null) {
  Object.assign(state, { draft, fileName, target, unsaved: false, started: true, loading: false, error: null, publishing: null, publishFailure: null, publishName: null })
}
```

Nos `reducers`, depois de `publishPasswordAsked`, adicione:

```js
    publishNameAsked(state, { payload }) {
      state.publishing = 'name'
      state.publishFailure = null
      state.publishLive = payload ?? null
    },
    publishNameChosen(state, { payload }) {
      state.publishName = payload
    },
```

No `publishDraft.fulfilled`, grave o destino:

```js
      .addCase(publishDraft.fulfilled, (state, { payload }) => {
        state.publishing = 'done'
        state.target = payload.name
        if (original(state).draft === payload.sent) state.unsaved = false
      })
```

No `export const { ... } = editorSlice.actions`, acrescente `publishNameAsked, publishNameChosen` (em ordem alfabética, como o resto).

- [ ] **Step 5: Add the name form**

Em `src/components/editor/PublishPanel.jsx`, troque os imports do topo por:

```js
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { choosePublishName, publishCancelled, publishDraft } from '../../store/editor'
import { isCampaignName } from '../../campaign/publisher'
```

Adicione, antes de `export function PublishPanel()`:

```jsx
function NameForm() {
  const dispatch = useDispatch()
  const suggested = useSelector(state => state.editor.publishName ?? state.editor.fileName)
  const live = useSelector(state => state.editor.publishLive)
  const [name, setName] = useState(suggested)
  const valid = isCampaignName(name)
  const replacing = valid && name === live

  return (
    <form
      className="editor__confirm"
      aria-label="Nome do arquivo publicado"
      onSubmit={e => {
        e.preventDefault()
        if (valid) dispatch(choosePublishName(name))
      }}
    >
      <label className="editor__password">
        <span>Nome do arquivo no bucket</span>
        <input required autoFocus value={name} onChange={e => setName(e.target.value)} />
      </label>
      {!valid && <p className="editor__publish-error">Use só letras minúsculas, números e -, terminando em .json.</p>}
      {replacing && <p className="editor__publish-error">Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles.</p>}
      <button type="submit" className="button primary" disabled={!valid}>{replacing ? 'Substituir' : 'Continuar'}</button>
      <button type="button" className="button secondary" onClick={() => dispatch(publishCancelled())}>Cancelar</button>
    </form>
  )
}
```

E em `PublishPanel`, antes da linha do `'password'`:

```jsx
  if (publishing === 'name') return <NameForm />
```

- [ ] **Step 6: Unlock Publicar for a draft without a destination**

Em `src/routes/gm/editor.lazy.jsx`, no `DraftBar`:

```jsx
  const { publishing } = useSelector(state => state.editor)
```

e no botão Publicar:

```jsx
        disabled={bad || publishing === 'sending'}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm vitest run src/routes/gm/editor.test.jsx`
Expected: PASS, incluindo os testes do #33 (`'asks the password the first time and publishes a draft from the bucket under the same name'` continua sem pedir nome).

Se `'asks the name of a blank draft'` falhar com "Publicar" travado, o Rascunho em branco tem outro erro além do hunter: rode o teste com `screen.debug(screen.getByRole('region', { name: 'Erros do rascunho' }))` e preencha o campo que falta no teste, sem mudar o código.

- [ ] **Step 8: Lint and full suite**

Run: `pnpm lint && pnpm test`
Expected: sem erros, tudo verde.

- [ ] **Step 9: Commit**

```bash
git add src/campaign/publisher.js src/store/editor.js src/components/editor/PublishPanel.jsx src/routes/gm/editor.lazy.jsx src/routes/gm/editor.test.jsx
git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "feat: ask the file name when publishing a new Rascunho"
```

---

### Task 2: Mostrar o Convite depois de publicar

**Files:**
- Modify: `src/store/editor.js`
- Modify: `src/components/editor/PublishPanel.jsx`
- Modify: `src/routes/gm/editor.lazy.jsx` (CSS do `editorPage`)
- Test: `src/routes/gm/editor.test.jsx`

**Interfaces:**
- Consumes: `publishDraft` devolvendo `{ sent, name, url }` (Task 1); `InviteBox({ campaignUrl: string, playable: bool })` de `src/components/gm/InviteBox.jsx` (rótulo do campo: "Convite da campanha"; botão "Copiar"); `openFromComputer`, `publishAs` da Task 1.
- Produces: estado `publishedUrl: string | null` em `src/store/editor.js`.

- [ ] **Step 1: Write the failing tests**

Em `src/routes/gm/editor.test.jsx`, dentro de `describe('a Rascunho that is not in the bucket', ...)`, depois do último `it`, adicione:

```js
    it('shows the Convite of the published address, ready to copy', async () => {
      await openFromComputer('mesa.json', { publishFetch: respondWith({ url: 'https://pub-123.r2.dev/noites.json' }) })

      publishAs('noites.json')

      const invite = await screen.findByLabelText('Convite da campanha')
      expect(invite.value).toBe(`${window.location.origin}/?campanha=${encodeURIComponent('https://pub-123.r2.dev/noites.json')}`)
      expect(screen.getByRole('button', { name: 'Copiar' }).disabled).toBe(false)
    })

    it('hides the Convite after the next change', async () => {
      await openFromComputer('mesa.json')
      publishAs()
      await screen.findByLabelText('Convite da campanha')

      fireEvent.change(screen.getByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })

      expect(screen.queryByLabelText('Convite da campanha')).toBeNull()
      expect(screen.queryByText('Publicado.')).toBeNull()
    })

    it.each([
      ['without an address', respondWith({})],
      ['that is not JSON', respondWith('ok')],
    ])('says it published, without a Convite, for an answer %s', async (_, publishFetch) => {
      await openFromComputer('mesa.json', { publishFetch })

      publishAs()

      expect(await screen.findByText('Publicado.')).toBeTruthy()
      expect(screen.queryByLabelText('Convite da campanha')).toBeNull()
    })
```

E, fora desse `describe` mas dentro de `describe('Publicar')`, um teste para o Rascunho do bucket:

```js
  it('shows the Convite after publishing a draft from the bucket', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null, editorStorage: memoryStorage({ [TOKEN_KEY]: 'guardada' }) })

    fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))

    expect((await screen.findByLabelText('Convite da campanha')).value).toContain(encodeURIComponent('https://pub-123.r2.dev/campanha.json'))
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/routes/gm/editor.test.jsx -t "Convite"`
Expected: FAIL em `'shows the Convite of the published address...'` e `'shows the Convite after publishing a draft from the bucket'` (`Unable to find a label with the text of: Convite da campanha`). Os outros já passam; tudo bem, eles protegem contra regressão.

- [ ] **Step 3: Keep the published address in the store**

Em `src/store/editor.js`:

- Em `initialEditorState`, adicione `publishedUrl: null,` depois de `publishName: null,`.
- Em `open(...)`, inclua `publishedUrl: null` no `Object.assign`.
- No `publishDraft.fulfilled`, depois de `state.target = payload.name`, adicione `state.publishedUrl = payload.url`.

- [ ] **Step 4: Show the Convite with Publicado.**

Em `src/components/editor/PublishPanel.jsx`, adicione o import:

```js
import { InviteBox } from '../gm/InviteBox'
```

Em `PublishPanel`, leia também `publishedUrl`:

```jsx
  const { publishing, publishFailure, publishedUrl } = useSelector(state => state.editor)
```

e troque a linha do `'done'` por:

```jsx
  if (publishing === 'done') {
    return (
      <div className="editor__done">
        <p className="editor__published" role="status">Publicado.</p>
        {publishedUrl && <InviteBox campaignUrl={publishedUrl} playable />}
      </div>
    )
  }
```

- [ ] **Step 5: Style the box**

Em `src/routes/gm/editor.lazy.jsx`, no CSS do `editorPage`, logo depois do bloco `.editor__publish-error { color: var(--perigo); }`, adicione:

```css
  .editor__done {
    margin: 12px 20px 0;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .editor__done .editor__published {
    margin: 0;
  }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run src/routes/gm/editor.test.jsx`
Expected: PASS.

- [ ] **Step 7: Lint, full suite and a look in the browser**

Run: `pnpm lint && pnpm test`
Expected: sem erros, tudo verde.

Depois, abra `/gm/editor` com `pnpm dev`, abra um arquivo do computador e clique Publicar (vai falhar sem o Worker, tudo bem): confira que o formulário do nome cabe na barra sem quebrar o layout. Para ver o Convite sem Worker, use o headless Chrome da memória do projeto (`browser-check-headless-chrome.md`) com `page.route('**/api/campanhas/*', r => r.fulfill({ json: { url: 'https://pub-123.r2.dev/noites.json' } }))`.

- [ ] **Step 8: Commit**

```bash
git add src/store/editor.js src/components/editor/PublishPanel.jsx src/routes/gm/editor.lazy.jsx src/routes/gm/editor.test.jsx
git -c user.name="André Adriano" -c user.email="a000.andre@gmail.com" commit -m "feat: show the Convite after publishing"
```
