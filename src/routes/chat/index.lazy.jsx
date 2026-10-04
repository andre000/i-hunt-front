/** @jsxImportSource @emotion/react */
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import { Footer } from '../../components/Footer'
import { Avatar } from '../../components/Avatar'
import { inbox } from '../../campaign/messages'
import { rowButton, stackedText } from '../../components/styles'
import { relativeToCampaign } from '../../campaign/time'

export const Route = createLazyFileRoute('/chat/')({
  component: InboxPage,
})

function InboxPage() {
  const navigate = useNavigate()
  const { data, hunterId, readMessageIds } = useSelector(state => state.campaign)
  const conversations = inbox(data, hunterId, readMessageIds)

  return (
    <main className='app-main'>
      <header css={headerStyle}>
        <h2>Mensagens</h2>
      </header>

      <div className='app-body' css={bodyStyle}>
        {conversations.length === 0 ? (
          <p className='inbox__empty'>Nenhuma mensagem por enquanto.</p>
        ) : (
          <ul>
            {conversations.map(({ npc, lastMessage, unread }) => (
              <li key={npc.id}>
                <button
                  type='button'
                  className='inbox__item'
                  onClick={() => navigate({ to: '/chat/$chatId', params: { chatId: npc.id } })}
                >
                  <Avatar person={npc} />
                  <span className='item__content'>
                    <span className='item__top'>
                      <span className='item__name'>{npc.name}</span>
                      <span className={unread > 0 ? 'item__time item__time--unread' : 'item__time'}>{relativeToCampaign(lastMessage.sentAt, data.campaign.date)}</span>
                    </span>
                    <span className='item__bottom'>
                      <span className={unread > 0 ? 'item__text item__text--unread' : 'item__text'}>{lastMessage.text}</span>
                      {unread > 0 && (
                        <span className='item__badge' aria-label={`${unread} não lidas`}>{unread}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Footer active='chat' />
    </main>
  )
}

const headerStyle = css`
  padding: 24px;
  background-color: #f60;
  color: #fff;

  h2 {
    font-weight: 700;
    font-family: 'Open Sans', sans-serif;
  }
`

const bodyStyle = css`
  padding: 8px 0 80px;

  .inbox__empty {
    padding: 24px;
    font-size: 14px;
    color: #777;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .inbox__item {
    ${rowButton}
    padding: 12px 24px;
    border: none;
    border-radius: 0;
  }

  .inbox__item:hover {
    background-color: #f7f7f7;
    color: #333;
  }

  .item__content {
    ${stackedText}
  }

  .item__top,
  .item__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .item__name {
    font-weight: 700;
  }

  .item__time {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
  }

  .item__text {
    font-size: 13px;
    color: #777;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item__text--unread {
    color: #333;
    font-weight: 600;
  }

  .item__time--unread {
    color: #f60;
    font-weight: 700;
  }

  .item__badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background-color: #f60;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`
