# Mensagens dos NPCs (#16) Implementation Plan

**Goal:** O chat vira a caixa de entrada só leitura das mensagens dos NPCs para o hunter escolhido, com não lidas guardadas no aparelho e indicador na navegação.

**Spec:** Issue #16, parte de #9. ADR 0001 e 0002.

## Decisões

- Schema ganha `npcs: [{ id, name, avatar? }]` e `messages: [{ id, npc, to, sentAt, text }]`, ambos opcionais (padrão `[]`).
  - `to` é `"all"` ou uma lista de ids de hunters (mín. 1).
  - `sentAt` (horário da ficção) é obrigatório; depois da data da campanha = agendada.
  - NPC ou hunter inexistente é erro de validação com caminho.
- Horário mostrado relativo à data da campanha (como prazos no #13), ex.: "há 2 horas".
- Conversas ordenadas pela mensagem mais recente; mensagens da conversa em ordem do horário da ficção.
- Lidas: ids das mensagens guardados no aparelho (`ihunt.readMessages`). Abrir a conversa marca as visíveis dela como lidas, inclusive as que chegam com a conversa aberta. Convite de outra campanha limpa as lidas.
- Sem avatar, o NPC aparece com as iniciais do nome.
- Indicador na navegação: bolinha com o número de não lidas sobre o ícone de mensagens.
- Telas reescritas em versão enxuta, só leitura: saem busca de conversas, "nova conversa", campo de envio, "digitando" e respostas aleatórias. `src/store/chats.js` é removido.

## Interfaces

src/campaign/campaign.js:
- `inbox(campaign, hunterId, readIds) -> [{ npc, lastMessage, unread }]`
- `conversation(campaign, hunterId, npcId) -> { npc, messages } | null`
- `unreadTotal(campaign, hunterId, readIds) -> number`

src/campaign/sync.js:
- `getReadMessageIds() -> string[]`, `markMessagesRead(ids) -> string[]` (devolve o conjunto atualizado)

## Tasks

1. TDD do schema e das funções de mensagens.
2. TDD das lidas no sync.
3. Store (`readMessageIds`, `markConversationRead`), lista de conversas, conversa, indicador no Footer.
4. `pnpm test`, `pnpm lint`, `pnpm build`; Chrome headless.
