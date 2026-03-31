/** @jsxImportSource @emotion/react */
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Footer } from '../../components/Footer'
import { useState } from 'react'
import { css } from '@emotion/react'
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { chats as initialChats } from '../../store/chats'

export const Route = createLazyFileRoute('/chat/')({
  component: ChatListPage,
})

function ChatListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const filtered = initialChats.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()),
  )

  const toggleSearch = () => {
    setSearchOpen((s) => !s)
    setSearch('')
  }

  return (
    <main className='app-main' css={mainOverride}>
      {/* Custom Header */}
      <header css={headerStyle}>
        <h2>Mensagens</h2>
        <div css={headerActionsStyle}>
          <button css={iconBtnStyle} onClick={toggleSearch} aria-label='Buscar'>
            {searchOpen ? <XMarkIcon width={22} /> : <MagnifyingGlassIcon width={22} />}
          </button>
          <button css={iconBtnStyle} aria-label='Nova conversa'>
            <PencilSquareIcon width={22} />
          </button>
        </div>
      </header>

      <div className='app-body' css={bodyStyle}>
        {/* Search bar */}
        {searchOpen && (
          <div css={searchBarStyle}>
            <MagnifyingGlassIcon width={16} css={searchIconStyle} />
            <input
              type='text'
              placeholder='Buscar conversa...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              css={searchInputStyle}
            />
          </div>
        )}

        {/* Conversation list */}
        <ul css={listStyle}>
          {filtered.length === 0 ? (
            <li css={emptyStyle}>Nenhuma conversa encontrada.</li>
          ) : (
            filtered.map((chat) => (
              <li
                key={chat.id}
                css={chatItemStyle}
                onClick={() =>
                  navigate({ to: '/chat/$chatId', params: { chatId: chat.id } })
                }
              >
                {/* Avatar */}
                <div css={avatarWrapStyle}>
                  <div
                    css={avatarBaseStyle}
                    style={{ backgroundColor: chat.avatarColor }}
                  >
                    {chat.initials}
                  </div>
                  {chat.isOnline && <span css={onlineDotStyle} />}
                </div>

                {/* Content */}
                <div css={chatContentStyle}>
                  <div css={chatTopRowStyle}>
                    <span css={chatNameStyle}>{chat.name}</span>
                    <span
                      css={[
                        chatTimeStyle,
                        chat.unreadCount > 0 && chatTimeUnreadStyle,
                      ]}
                    >
                      {chat.lastTime}
                    </span>
                  </div>
                  <div css={chatBottomRowStyle}>
                    <span css={chatLastMsgStyle}>{chat.lastMessage}</span>
                    {chat.unreadCount > 0 && (
                      <span css={unreadBadgeStyle}>{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <Footer active='chat' />
    </main>
  )
}

/* ── Styles ─────────────────────────────────────────────────── */

const mainOverride = css`
  display: flex;
  flex-direction: column;
`

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px;
  background-color: #f60;

  h2 {
    color: #fff;
    font-size: 22px;
    margin: 0;
  }
`

const headerActionsStyle = css`
  display: flex;
  gap: 4px;
`

const iconBtnStyle = css`
  background: none;
  border: none;
  padding: 7px;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`

const bodyStyle = css`
  padding: 0;
  padding-bottom: 80px !important;
`

const searchBarStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px 4px;
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 8px 12px;
`

const searchIconStyle = css`
  color: #999;
  flex-shrink: 0;
`

const searchInputStyle = css`
  flex-grow: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: #333;

  &::placeholder {
    color: #aaa;
  }
`

const listStyle = css`
  list-style: none;
  margin: 0;
  padding: 8px 0 0;
`

const chatItemStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.12s;

  &:active {
    background-color: #fff5eb;
  }

  &:last-child {
    border-bottom: none;
  }
`

const avatarWrapStyle = css`
  position: relative;
  flex-shrink: 0;
`

const avatarBaseStyle = css`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  font-family: 'Saira', sans-serif;
`

const onlineDotStyle = css`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 13px;
  height: 13px;
  background-color: #22c55e;
  border-radius: 50%;
  border: 2px solid #fff;
`

const chatContentStyle = css`
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const chatTopRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
`

const chatNameStyle = css`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`

const chatTimeStyle = css`
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
`

const chatTimeUnreadStyle = css`
  color: #f60;
  font-weight: 600;
`

const chatBottomRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const chatLastMsgStyle = css`
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`

const unreadBadgeStyle = css`
  background-color: #f60;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
`

const emptyStyle = css`
  padding: 48px 16px;
  text-align: center;
  color: #bbb;
  font-size: 14px;
  list-style: none;
`

