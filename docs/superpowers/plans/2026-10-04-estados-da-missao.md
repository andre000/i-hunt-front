# Estados da missão, agendadas e detalhe (#13) Implementation Plan

**Goal:** Missões com estado derivado, conteúdo agendado oculto e tempo relativo à data da campanha (ADR 0002); detalhe mostra estado e hunters.

**Spec:** Issue #13, parte de #9. `GLOSSARY.md` (estados da missão, agendado, data da campanha).

## Decisões

- Schema da missão ganha (todos opcionais): `hunters: [hunterId]`, `result: "concluída" | "fracassada"`, `deadline: date-time` (prazo), `postedAt: date-time` (horário da ficção). Sem `postedAt`, a missão nunca é agendada.
- Hunter inexistente em `hunters` é erro de validação, como em `nearHunters`.
- Estado (ids internos → rótulo): `result` concluída → `completed` (Concluída); fracassada → `failed` (Fracassada); com hunters → `in-progress` (Em andamento); `deadline` antes da data da campanha → `expired` (Expirada); senão `available` (Disponível). Em andamento não expira.
- Agendada = `postedAt` depois da data da campanha. Jogadores não a veem na home nem no detalhe (detalhe responde "não encontrada").
- Home: destaque e "perto de você" só com missões abertas (Disponível ou Em andamento); o contador conta as Disponíveis.
- Tempo relativo em português com `Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })`, contra a data da campanha.

## Interfaces (src/campaign/campaign.js)

- `MISSION_STATUS_LABEL: { available, 'in-progress', completed, failed, expired }`
- `missionStatus(mission, campaignDate) -> status`
- `isScheduled(item, campaignDate) -> boolean` (usa `postedAt`)
- `visibleMissions(campaign) -> MissionView[]` — `MissionView = mission + { status, hunterNames: string[] }`
- `missionDetail(campaign, missionId) -> MissionView | null` (null para agendada ou inexistente)
- `homeView(campaign, hunterId) -> { featured, nearby, available }`
- `relativeToCampaign(isoDate, campaignDate) -> string`

## Tasks

1. TDD no Módulo da Campanha: validação dos campos novos; cada estado; expiração pela data da campanha; Em andamento não expira; agendada oculta na home e no detalhe; contador; tempo relativo.
2. Telas: detalhe com badge de estado, lista de hunters, prazo e publicação relativos; `NearbyMission` mostra o estado; home usa `available`.
3. `pnpm test`, `pnpm lint`, `pnpm build`; checagem em Chrome headless.
