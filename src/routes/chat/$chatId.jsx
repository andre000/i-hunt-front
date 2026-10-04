/** @jsxImportSource @emotion/react */
import { useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Avatar } from '../../components/Avatar'
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
          <ChevronLeftIcon width={24} />
        </button>
        <Avatar person={thread.npc} size={40} />
        <h2>{thread.npc.name}</h2>
      </header>

      <ol css={messagesStyle}>
        {thread.messages.map(message => (
          <li key={message.id}>
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
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f2f2f2;
`

const headerStyle = css`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f60;
  color: #fff;

  button {
    padding: 4px;
    background: none;
    color: #fff;
    display: flex;
  }

  button:hover {
    background: none;
  }

  h2 {
    font-size: 16px;
    font-weight: 700;
    font-family: 'Open Sans', sans-serif;
  }
`

const messagesStyle = css`
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li:not([aria-hidden]) {
    align-self: flex-start;
    max-width: 80%;
    background-color: #fff;
    border-radius: 4px 16px 16px 16px;
    padding: 10px 12px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
  }

  p {
    font-size: 14px;
    color: #333;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  time {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: #999;
    text-align: right;
  }
`

const readOnlyStyle = css`
  padding: 12px 16px 20px;
  font-size: 12px;
  color: #999;
  text-align: center;
`

const notFoundStyle = css`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #333;
`
