# Lista completa de missões com filtros (#15) Implementation Plan

**Goal:** A tela de busca lista todas as missões visíveis (não agendadas) e filtra por estado e por risco.

**Spec:** Issue #15, parte de #9.

## Decisões

- Filtros são grupos de chips de múltipla escolha: estados (Disponível, Em andamento, Concluída, Fracassada, Expirada) e riscos (baixo, médio, alto). Dentro do grupo vale "ou"; entre os grupos vale "e". Grupo sem chip marcado não filtra.
- A lista segue a ordem do JSON (o GM decide a ordem).
- O filtro vive só na tela (não fica guardado no aparelho).
- Cada item mostra nome, estado, risco, valor e prazo relativo à data da campanha (quando houver prazo).
- Sem resultado: "Nenhuma missão com esses filtros."

## Interfaces (src/campaign/campaign.js)

- `RISKS = ['baixo', 'médio', 'alto']`
- `missionList(campaign, { statuses = [], risks = [] } = {}) -> MissionView[]`

## Tasks

1. TDD de `missionList`: sem filtro (sem agendadas), por estado, por risco, combinados, vários estados.
2. Tela de busca com chips e lista; tocar abre o detalhe; sai o `UnderMaintenance` (componente removido, não é usado em outro lugar).
3. `pnpm test`, `pnpm lint`, `pnpm build`; Chrome headless.
