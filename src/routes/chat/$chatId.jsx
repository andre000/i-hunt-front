/** @jsxImportSource @emotion/react */
import { useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Avatar } from '../../components/Avatar'
import { CampaignClock } from '../../components/CampaignClock'
import { conversation } from '../../campaign/messages'
import { relativeToCampaign } from '../../campaign/time'
import { markConversationRead } from '../../store/campaign'

export const Route = createFileRoute('/chat/$chatId')({
  component: ConversationPage,
})

function ConversationPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { chatId } = Route.useParams()
  const { data, hunterId } = useSelector(state => state.campaign)
  const thread = conversation(data, hunterId, chatId)
  const lastMessageId = thread?.messages.at(-1).id
  const endRef = useRef(null)

  useEffect(() => {
    if (!lastMessageId) return
    dispatch(markConversationRead(chatId))
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dispatch, chatId, lastMessageId])

  const goBack = () => navigate({ to: '/chat' })

  if (!thread) {
    return (
      <main css={notFoundStyle}>
        <p>Conversa não encontrada.</p>
        <button className='button primary' onClick={goBack}>Voltar</button>
      </main>
    )
  }

  return (
    <main css={pageStyle}>
      <header css={headerStyle}>
        <button type='button' onClick={goBack} aria-label='Voltar'>
          <ChevronLeftIcon width={20} />
        </button>
        <Avatar person={thread.npc} size={40} />
        <h2>{thread.npc.name}</h2>
        <CampaignClock className='conversation__clock' />
      </header>

      <ol css={messagesStyle}>
        {thread.messages.map(message => (
          <li key={message.id} className='message'>
            <p>{message.text}</p>
            <time dateTime={message.sentAt}>{relativeToCampaign(message.sentAt, data.campaign.date)}</time>
          </li>
        ))}
        <li ref={endRef} aria-hidden='true' />
      </ol>

      <p css={readOnlyStyle}>Só o NPC envia mensagens por aqui.</p>
    </main>
  )
}

const pageStyle = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--asfalto);
`

const headerStyle = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 12px;
  border-bottom: 1px solid var(--linha);

  button {
    width: 38px;
    height: 38px;
    padding: 0;
    border-radius: 12px;
    background-color: var(--painel-2);
    color: var(--texto);
    display: grid;
    place-items: center;
  }

  button:hover {
    background-color: var(--linha);
  }

  h2 {
    flex: 1;
    min-width: 0;
    font-size: 16px;
    letter-spacing: -0.01em;
  }
`

const messagesStyle = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .message {
    align-self: flex-start;
    max-width: 84%;
    background-color: var(--painel-2);
    border-radius: 18px 18px 18px 6px;
    padding: 10px 12px 8px;
  }

  p {
    font-size: 15px;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  time {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: var(--apagado);
    text-align: right;
  }
`

const readOnlyStyle = css`
  flex-shrink: 0;
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--linha);
  font-size: 12px;
  color: var(--apagado);
  text-align: center;
`

const notFoundStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`
