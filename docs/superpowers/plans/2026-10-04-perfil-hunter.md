# Perfil do hunter com ganhos e missões (#17) Implementation Plan

**Goal:** O perfil mostra o hunter escolhido (avatar, nome, avaliação), os ganhos e as missões Em andamento e Concluídas; dá para trocar de hunter. Sai o usuário fixo.

**Spec:** Issue #17, parte de #9.

## Decisões

- Hunter ganha `avatar` (URL) e `rating` (número de 0 a 5), ambos opcionais. Sem avatar: iniciais (o `NpcAvatar` vira `Avatar`, genérico). Sem avaliação: as estrelas não aparecem (perfil e Header).
- Ganhos = soma, nas missões visíveis com estado Concluída que têm o hunter, de `valor / número de hunters da missão`. Fracassada não paga. Mostrado com `formatBRL`.
- Listas: Em andamento e Concluídas (Fracassadas e as demais não aparecem no perfil), na ordem do JSON.
- "Trocar de hunter" esquece o hunter no aparelho e o portão mostra a escolha do hunter.
- Saem do perfil o e-mail e o botão "Editar perfil" (não existem na ficção do JSON); sai `src/store/user.js`.

## Interfaces

- `hunterProfile(campaign, hunterId) -> { hunter, earnings, inProgress: MissionView[], completed: MissionView[] } | null`
- sync: `clearHunterId()`
- store: thunk `forgetHunter()`

## Tasks

1. TDD: schema (avatar, rating fora de 0–5), ganhos (missão sozinho, dividida, Fracassada não conta, agendada não conta), listas por estado, hunter inexistente.
2. TDD: `clearHunterId` no sync.
3. Store, perfil, Header com avaliação real, `Avatar` genérico.
4. `pnpm test`, `pnpm lint`, `pnpm build`; Chrome headless.
