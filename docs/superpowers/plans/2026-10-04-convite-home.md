# Do Convite à home com missões reais (#12) Implementation Plan

**Goal:** Convite → campanha carregada do JSON → escolha do hunter → home com missões do JSON. Sai o dado fixo de missões.

**Spec:** Issue #12, parte de #9. ADR 0001 e 0002. `GLOSSARY.md`.

**Architecture:** Dois módulos puros testados (`src/campaign/campaign.js` e `src/campaign/sync.js`), um slice Redux fino (`src/store/campaign.js`) que injeta o sync como `extraArgument` do thunk, e um portão no `__root.jsx` que decide entre carregando / sem campanha / erro / escolha do hunter / app.

## Decisões (rulings, sem decisão do usuário no ticket)

- Convite: `https://<app>/?campanha=<url do JSON codificada>`. Só aceita `http:`/`https:`. O parâmetro sai da barra de endereço depois de lido.
- Chaves do JSON em inglês (como o código); descrições em português chegam no schema final (#19).
- Schema v1 (`src/campaign/campaign.schema.json`, JSON Schema draft-07, validado com `ajv` + `ajv-formats`):
  - `campaign`: `{ name: string, date: date-time }`
  - `hunters`: `[{ id, name }]` (mín. 1)
  - `missions`: `[{ id, name, location, value >= 0, risk: "baixo"|"médio"|"alto", description?, tags?, featured?, nearHunters?: [hunterId] }]`
- "Perto do hunter" = o GM lista os ids em `nearHunters` da missão. Destaque = primeira missão com `featured: true`; sem nenhuma, a home não mostra o card.
- Referência a hunter inexistente em `nearHunters` é erro de validação (com caminho do campo).
- Mensagens de erro do ajv ficam em inglês por enquanto; tradução fica para a Visão do GM (#18).
- Um Convite novo substitui a campanha e esquece o hunter escolhido (a confirmação é do #14).
- `localStorage` que lança erro (aba privada) é tratado como vazio.
- `ClosingMission` vira `NearbyMission` (nome + local); prazo volta no #13.
- Detalhe da missão mostra só os campos do schema v1 (estado, prazo e hunters voltam no #13). O botão "Aceitar Missão" sai junto, porque não há mais `assigned`.
- Perfil continua com o usuário fixo até o #17 e lê as missões da campanha (listas vazias até o schema ter hunters na missão).
- Header mostra "Olá <nome do hunter>".

## Interfaces

- `parseCampaign(raw: unknown) -> { ok: true, campaign } | { ok: false, errors: [{ path: string, message: string }] }` — `campaign` normalizado (`tags: []`, `nearHunters: []`, `featured: false`, `description: ''` quando ausentes).
- `findHunter(campaign, hunterId) -> hunter | null`
- `findMission(campaign, missionId) -> mission | null`
- `homeView(campaign, hunterId) -> { featured: mission | null, nearby: mission[], total: number }` (nearby não repete o destaque).
- `readInvite(search: string) -> string | null`
- `createSync({ fetch, storage })` → `{ acceptInvite(url), getHunterId(), setHunterId(id), load() }`; `load() -> { status: 'no-campaign' } | { status: 'ready', campaign } | { status: 'invalid', errors } | { status: 'error', error: string }`.

## Tasks

1. Módulo da Campanha + schema (TDD): válido; inválido por campo; não-objeto; hunter inexistente em `nearHunters`; normalização; `homeView` com e sem destaque; `findHunter`/`findMission`.
2. Módulo de Sincronização (TDD, rede e storage falsos): `readInvite`; sem campanha; Convite guarda URL e limpa hunter; `load` ok com `cache: 'no-store'`; HTTP de erro; rede caindo; JSON quebrado; JSON fora do schema; storage que lança; hunter guardado.
3. Store + portão + telas: slice `campaign`, `createAppStore({ sync })`, `main.jsx` lê o Convite, `__root.jsx` portão, tela `CampaignStatus`, login vira escolha do hunter (mantém animação), home e detalhe leem a campanha, `NearbyMission`, Header com nome; remove `missions.js` e `_mission-demo.js`.
4. `pnpm test`, `pnpm lint`, `pnpm build`; conferir no dev server com um JSON local.
