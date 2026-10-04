# Sincronização contínua, offline e JSON inválido (#14) Implementation Plan

**Goal:** O app relê a campanha sozinho (abrir, voltar ao app, voltar a rede, a cada 30 s), aguenta rede ruim e JSON inválido mostrando a última versão válida, e pede confirmação antes de um Convite novo substituir a campanha.

**Spec:** Issue #14, parte de #9. ADR 0001.

## Decisões

- A última versão válida fica no aparelho junto com a URL de onde veio (`ihunt.lastCampaign` = `{ url, raw }`). Ela só é usada se a URL for a da campanha atual, e é revalidada com `parseCampaign` ao ser lida.
- Resultado de `load()` com versão guardada disponível é sempre `ready`, com:
  - `offline: true` quando o `fetch` falha (sem rede);
  - `updateError: 'HTTP 500'` quando o servidor responde com erro;
  - `errors: [...]` quando o JSON novo é inválido (para a Visão do GM, #18).
  Sem versão guardada, os resultados de antes continuam (`error`, `invalid`).
- Aviso discreto: faixa fina no topo. Offline: "Sem conexão. Mostrando a última versão salva." Erro HTTP: "Não foi possível atualizar a campanha." JSON inválido não mostra nada para o jogador.
- Releitura: `createSyncLoop` com relógio e evento de "voltou" injetáveis. Voltar = `visibilitychange` para visível ou evento `online`. Não roda duas leituras ao mesmo tempo.
- Convite: `sync.offerInvite(url)` aceita direto se não há campanha ou se é a mesma; se é outra, devolve `'needs-confirmation'` e não muda nada. A tela de confirmação é do app (não `window.confirm`), com "Trocar de campanha" e "Manter a atual".

## Interfaces (src/campaign/sync.js)

- `offerInvite(url) -> 'accepted' | 'needs-confirmation'`
- `acceptInvite(url)` (já existe; também descarta a versão guardada de outra URL)
- `load() -> { status: 'no-campaign' } | { status: 'ready', campaign, offline, updateError, errors } | { status: 'invalid', errors } | { status: 'error', error }`
- `createSyncLoop({ load, onResult, setInterval, clearInterval, onReturn, intervalMs = 30000 }) -> { start(), stop() }` — `onReturn(run)` devolve a função que desinscreve.

## Tasks

1. TDD no sync: conteúdo novo, JSON inválido mantém a última válida, offline com e sem versão guardada, erro HTTP, versão de outra URL ignorada, app reaberto offline, `offerInvite`.
2. TDD no loop: roda ao começar, a cada 30 s, ao voltar; não sobrepõe; `stop` para tudo.
3. Store e telas: slice guarda `offline`, `updateError`, `errors`, `pendingInvite`; `main.jsx` liga o loop no navegador; faixa de aviso; tela de confirmação do Convite.
4. `pnpm test`, `pnpm lint`, `pnpm build`; Chrome headless (troca no JSON aparece sozinha, offline, JSON inválido, confirmação do Convite).
