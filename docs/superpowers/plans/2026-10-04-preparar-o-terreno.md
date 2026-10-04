# Preparar o terreno (#10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o projeto com Vitest rodando, lint verde e o código falando "Missão", sem mudar comportamento visível (fora a saída da página About).

**Architecture:** Refatoração preparatória. Vitest entra integrado ao `vite.config.js`. O primeiro teste real cobre um helper puro novo (`formatBRL`) que substitui a formatação de moeda repetida em 3 telas. Componentes e rota de detalhe trocam Job/Task por Mission.

**Tech Stack:** React 18, Vite 5, TanStack Router (rotas por arquivo, `routeTree.gen.ts` gerado pelo plugin), Emotion, Redux Toolkit, ESLint 8, pnpm. Novo: Vitest 3.

**Spec:** Issue #10 (`gh issue view 10`), parte da spec #9 (`gh issue view 9`). Vocabulário: `GLOSSARY.md`.

## Global Constraints

- Commits: Conventional Commits em inglês, só a linha de assunto, sem `Co-Authored-By`. Autor: `git -c user.name="André Adriano" -c user.email=a000.andre@gmail.com commit -m "..."`.
- Sem comentários novos no código.
- Interface só em português.
- Glossário: "Missão" no lugar de Job/Task/tarefa. No código em inglês, o termo é `mission`.
- `pnpm build`, `pnpm lint` e `pnpm test` precisam passar no final.
- Nenhuma mudança visível além da remoção da página About.

## Review Focus

- Valor da missão inteiro (ex.: `1500`) deve continuar aparecendo `R$ 1500,00`, igual a hoje → teste em Task 1.
- Valor com centavos que arredonda (ex.: `99.999`) deve dar `R$ 100,00`, igual ao `toFixed(2)` de hoje → teste em Task 1.
- Link antigo `/task/<id>` (favorito ou PWA instalado) cai na rota inexistente; aceitável, porque o app ainda é só demonstração. Conferir na mão que `/mission/<id>` abre o detalhe → Task 3, Step 5.
- `src/routeTree.gen.ts` precisa ser regenerado e commitado; se ficar velho, o import de `/task/$taskId` quebra o build → Task 3 e Task 4.
- Clique numa missão na home não deve mais escrever nada no console → Task 3, Step 5.

---

### Task 1: Vitest e helper `formatBRL`

**Files:**
- Modify: `package.json` (script `test`, devDependency `vitest`)
- Modify: `vite.config.js` (bloco `test`)
- Create: `src/utils/format.js`
- Test: `src/utils/format.test.js`
- Modify: `src/components/FeaturedJob.jsx:33`
- Modify: `src/routes/task/$taskId.jsx:124`
- Modify: `src/routes/profile/index.lazy.jsx:34`

**Interfaces:**
- Produces: `export function formatBRL(value: number): string` em `src/utils/format.js`. Retorna `R$ ` + valor com 2 casas e vírgula decimal, sem separador de milhar (mesmo resultado de hoje).

- [ ] **Step 1: Instalar o Vitest**

Run: `pnpm add -D vitest@^3`

- [ ] **Step 2: Adicionar o script e a config**

Em `package.json`, dentro de `scripts`, depois de `"preview"`:

```json
    "preview": "vite preview",
    "test": "vitest run"
```

Em `vite.config.js`, logo antes de `plugins: [`:

```js
export default defineConfig({
  test: {
    environment: 'node',
  },
  plugins: [
```

- [ ] **Step 3: Escrever o teste que falha**

`src/utils/format.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { formatBRL } from './format'

describe('formatBRL', () => {
  it('formats a value with cents using a decimal comma', () => {
    expect(formatBRL(250.5)).toBe('R$ 250,50')
  })

  it('adds two decimal places to integer values', () => {
    expect(formatBRL(1500)).toBe('R$ 1500,00')
  })

  it('rounds to two decimal places', () => {
    expect(formatBRL(99.999)).toBe('R$ 100,00')
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `pnpm test`
Expected: FAIL, não acha `./format`.

- [ ] **Step 5: Implementar**

`src/utils/format.js`:

```js
export function formatBRL(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `pnpm test`
Expected: 3 testes PASS.

- [ ] **Step 7: Usar o helper nas 3 telas**

`src/components/FeaturedJob.jsx`: adicionar `import { formatBRL } from '../utils/format'` e trocar

```jsx
          <span>R$ {data.value.toFixed(2).replace('.', ',')}</span>
```
por
```jsx
          <span>{formatBRL(data.value)}</span>
```

`src/routes/task/$taskId.jsx`: adicionar `import { formatBRL } from '../../utils/format'` e trocar

```jsx
              value={`R$ ${value.toFixed(2).replace('.', ',')}`}
```
por
```jsx
              value={formatBRL(value)}
```

`src/routes/profile/index.lazy.jsx`: adicionar `import { formatBRL } from '../../utils/format'` e trocar

```jsx
        <span className='mc__value'>R$ {mission.value.toFixed(2).replace('.', ',')}</span>
```
por
```jsx
        <span className='mc__value'>{formatBRL(mission.value)}</span>
```

- [ ] **Step 8: Conferir**

Run: `pnpm test && pnpm build`
Expected: testes PASS, build OK.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.js src/utils/format.js src/utils/format.test.js src/components/FeaturedJob.jsx 'src/routes/task/$taskId.jsx' src/routes/profile/index.lazy.jsx
git -c user.name="André Adriano" -c user.email=a000.andre@gmail.com commit -m "test: add vitest and formatBRL helper"
```

---

### Task 2: Lint verde na tela de perfil

Hoje `pnpm lint` falha com 20 erros `react/prop-types` em `src/routes/profile/index.lazy.jsx`. O resto do projeto declara `propTypes`; seguir o mesmo padrão.

**Files:**
- Modify: `src/routes/profile/index.lazy.jsx`

**Interfaces:**
- Consumes: nada novo.
- Produces: nada novo.

- [ ] **Step 1: Ver o erro**

Run: `pnpm lint`
Expected: FAIL, 20 erros `react/prop-types`.

- [ ] **Step 2: Adicionar o import**

No topo, junto aos outros imports:

```js
import PropTypes from 'prop-types'
```

- [ ] **Step 3: Declarar `propTypes` logo depois de cada componente**

Depois de `function ProfileMissionCard`:

```js
const missionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  risk: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  expiresDate: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]).isRequired,
})

ProfileMissionCard.propTypes = {
  mission: missionShape.isRequired,
  onClick: PropTypes.func.isRequired,
}
```

Depois de `function StarRating`:

```js
StarRating.propTypes = {
  value: PropTypes.number.isRequired,
}
```

Depois de `function HuntSection`:

```js
HuntSection.propTypes = {
  title: PropTypes.string.isRequired,
  missions: PropTypes.arrayOf(missionShape).isRequired,
  navigate: PropTypes.func.isRequired,
}
```

- [ ] **Step 4: Conferir**

Run: `pnpm lint`
Expected: nenhum erro.

Abrir `pnpm dev`, ir em `/profile` e conferir no console do navegador que não aparece aviso `Failed prop type`. Se aparecer, o dado de demonstração (`src/store/_mission-demo.js`) tem um campo de outro tipo: ajustar o `missionShape` ao dado real, não o dado.

- [ ] **Step 5: Commit**

```bash
git add src/routes/profile/index.lazy.jsx
git -c user.name="André Adriano" -c user.email=a000.andre@gmail.com commit -m "fix: declare prop types on profile page"
```

---

### Task 3: Vocabulário "Missão" (componentes e rota)

**Files:**
- Rename: `src/components/FeaturedJob.jsx` → `src/components/FeaturedMission.jsx`
- Rename: `src/components/ClosingJob.jsx` → `src/components/ClosingMission.jsx`
- Rename: `src/routes/task/$taskId.jsx` → `src/routes/mission/$missionId.jsx`
- Modify: `src/routes/index.lazy.jsx`
- Modify: `src/routes/profile/index.lazy.jsx:80`
- Regenerate: `src/routeTree.gen.ts`

**Interfaces:**
- Produces: componentes `FeaturedMission({ data, onClick })` e `ClosingMission({ onClick, data })` (mesmas props de antes); rota `/mission/$missionId` com param `missionId`.

- [ ] **Step 1: Renomear os arquivos**

```bash
git mv src/components/FeaturedJob.jsx src/components/FeaturedMission.jsx
git mv src/components/ClosingJob.jsx src/components/ClosingMission.jsx
mkdir -p src/routes/mission
git mv 'src/routes/task/$taskId.jsx' 'src/routes/mission/$missionId.jsx'
```

- [ ] **Step 2: Renomear dentro dos componentes**

`src/components/FeaturedMission.jsx`:
- `export function FeaturedJob` → `export function FeaturedMission`
- `FeaturedJob.propTypes` → `FeaturedMission.propTypes`
- `const featuredJob = css` → `const featuredMission = css`, e `css={featuredJob}` → `css={featuredMission}`
- `className="job"` e as classes `job__*` → `mission` e `mission__*`; no CSS, `.job {` → `.mission {`.

`src/components/ClosingMission.jsx`:
- `export function ClosingJob` → `export function ClosingMission`
- `ClosingJob.propTypes` → `ClosingMission.propTypes`
- `const closingJob = css` → `const closingMission = css`, e `css={closingJob}` → `css={closingMission}`

- [ ] **Step 3: Renomear a rota de detalhe**

Em `src/routes/mission/$missionId.jsx`:

```jsx
export const Route = createFileRoute('/mission/$missionId')({
  component: MissionComponent,
})
```

```jsx
function MissionComponent() {
  const dispatch = useDispatch()
  const { missionId } = Route.useParams()
  const mission = useSelector(state => state.missions.list.find(m => m.id === missionId))
```

E no texto de "não encontrada": `A tarefa que você procura` → `A missão que você procura`.

- [ ] **Step 4: Atualizar quem usa**

`src/routes/index.lazy.jsx`:

```jsx
import { FeaturedMission } from '../components/FeaturedMission';
import { ClosingMission } from '../components/ClosingMission';
```

```jsx
  const featuredMission = missions.find(mission => mission.isFeatured)
  const nearbyMissions = missions.filter(mission => mission.isNearUser)

  const navigate = useNavigate()
  const handleMissionClick = (mission) => {
    navigate({ to: '/mission/$missionId', params: { missionId: mission.id } })
  }
```

```jsx
        <FeaturedMission data={featuredMission} onClick={() => handleMissionClick(featuredMission)} />
```

```jsx
          {nearbyMissions.map(mission => (
            <ClosingMission key={mission.id} data={mission} onClick={() => handleMissionClick(mission)} />
          ))}
```

`src/routes/profile/index.lazy.jsx` (dentro de `HuntSection`):

```jsx
              onClick={() => navigate({ to: '/mission/$missionId', params: { missionId: m.id } })}
```

- [ ] **Step 5: Regenerar a árvore de rotas e conferir na mão**

Run: `pnpm build`
Expected: build OK; `src/routeTree.gen.ts` passa a citar `/mission/$missionId` e não cita mais `/task`.

Run: `grep -rniE "job|task" src --include='*.js' --include='*.jsx' --include='*.ts'`
Expected: nenhuma linha.

Run: `pnpm dev`. Na home, clicar na missão em destaque e numa missão próxima: o detalhe abre em `/mission/<id>` e o console fica vazio. No perfil, clicar numa missão abre o mesmo detalhe.

- [ ] **Step 6: Conferir lint e testes**

Run: `pnpm lint && pnpm test`
Expected: ambos passam.

- [ ] **Step 7: Commit**

```bash
git add -A src
git -c user.name="André Adriano" -c user.email=a000.andre@gmail.com commit -m "refactor: rename job and task to mission"
```

---

### Task 4: `lang="pt-BR"` e saída da página About

**Files:**
- Modify: `index.html:2`
- Delete: `src/routes/about.lazy.jsx`
- Regenerate: `src/routeTree.gen.ts`

- [ ] **Step 1: Idioma do documento**

Em `index.html`, trocar `<html lang="en">` por:

```html
<html lang="pt-BR">
```

- [ ] **Step 2: Remover a About**

```bash
git rm src/routes/about.lazy.jsx
```

- [ ] **Step 3: Regenerar e conferir**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: tudo passa.

Run: `grep -n about src/routeTree.gen.ts`
Expected: nenhuma linha.

- [ ] **Step 4: Commit**

```bash
git add index.html src/routeTree.gen.ts
git -c user.name="André Adriano" -c user.email=a000.andre@gmail.com commit -m "chore: set pt-BR language and remove about page"
```

---

## Checklist final (critérios do #10)

- [ ] `pnpm test` roda e passa com teste real → Task 1
- [ ] `pnpm lint` sem erros → Task 2 (e conferido nas Tasks 3 e 4)
- [ ] "Missão" no lugar de Job/Task; rota de detalhe não é mais `task` → Task 3
- [ ] `lang="pt-BR"` → Task 4
- [ ] About removida → Task 4
- [ ] `console.log` da home removido → Task 3
- [ ] `pnpm build` passa → Task 4
