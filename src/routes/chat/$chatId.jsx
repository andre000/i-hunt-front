/** @jsxImportSource @emotion/react */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { css, keyframes } from '@emotion/react'
import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  FaceSmileIcon,
  PaperClipIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { chats, botReplies } from '../../store/chats'

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatDetailPage,
})

function getNow() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ChatDetailPage() {
  const navigate = useNavigate()
  const { chatId } = Route.useParams()
  const chat = chats.find((c) => c.id === chatId)

  const [messages, setMessages] = useState(chat?.messages ?? [])
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (!chat) {
    return (
      <div css={notFoundStyle}>
        <p>Conversa não encontrada.</p>
        <button className='button primary' onClick={() => navigate({ to: '/chat' })}>
          Voltar
        </button>
      </div>
    )
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, from: 'user', text: trimmed, time: getNow(), status: 'sent' },
    ])
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setIsTyping(true)
    setTimeout(() => {
      const reply = botReplies[Math.floor(Math.random() * botReplies.length)]
      setMessages((prev) => [
        ...prev,
        { id: `m${Date.now() + 1}`, from: 'other', text: reply, time: getNow() },
      ])
      setIsTyping(false)
    }, 1800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div css={pageStyle}>
      {/* Header */}
      <header css={headerStyle}>
        <button css={iconActionStyle} onClick={() => navigate({ to: '/chat' })} aria-label='Voltar'>
          <ChevronLeftIcon width={24} />
        </button>

        <div css={headerCenterStyle}>
          <div css={headerAvatarStyle} style={{ backgroundColor: chat.avatarColor }}>
            {chat.initials}
          </div>
          <div css={headerInfoStyle}>
            <span css={headerNameStyle}>{chat.name}</span>
            <span css={headerStatusStyle}>
              {chat.isOnline ? '● Online' : 'Offline'}
            </span>
          </div>
        </div>

        <button css={iconActionStyle} aria-label='Menu'>
          <EllipsisVerticalIcon width={22} />
        </button>
      </header>

      {/* Messages area */}
      <div css={messagesAreaStyle}>
        <div css={dateSeparatorStyle}>
          <span>Hoje</span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            css={[bubbleWrapStyle, msg.from === 'user' ? bubbleWrapUserStyle : bubbleWrapOtherStyle]}
          >
            <div css={[baseBubbleStyle, msg.from === 'user' ? userBubbleStyle : otherBubbleStyle]}>
              <span>{msg.text}</span>
              <div css={[timestampStyle, msg.from === 'user' ? timestampUserStyle : timestampOtherStyle]}>
                {msg.time}
                {msg.from === 'user' && <span css={checkStyle}>✓✓</span>}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div css={bubbleWrapOtherStyle}>
            <div css={typingBubbleStyle}>
              <span css={[dotStyle, dot1Style]} />
              <span css={[dotStyle, dot2Style]} />
              <span css={[dotStyle, dot3Style]} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input toolbar */}
      <div css={inputBarStyle}>
        <button css={toolBtnStyle} aria-label='Emoji'>
          <FaceSmileIcon width={22} />
        </button>
        <button css={toolBtnStyle} aria-label='Anexo'>
          <PaperClipIcon width={22} />
        </button>
        <textarea
          ref={textareaRef}
          css={textareaStyle}
          placeholder='Mensagem...'
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        {text.trim() ? (
          <button css={sendBtnStyle} onClick={handleSend} aria-label='Enviar'>
            <PaperAirplaneIcon width={20} />
          </button>
        ) : (
          <button css={sendBtnStyle} aria-label='Áudio'>
            <MicrophoneIcon width={22} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Keyframes ──────────────────────────────────────────────── */

const bounceDot = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
  30% { transform: translateY(-5px); opacity: 1; }
`

/* ── Styles ─────────────────────────────────────────────────── */

const pageStyle = css`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 72px;
`

const headerStyle = css`
  display: flex;
  align-items: center;
  padding: 10px 8px 10px 4px;
  background-color: #f60;
  gap: 4px;
  position: sticky;
  top: 0;
  z-index: 10;
`

const iconActionStyle = css`
  background: none;
  border: none;
  color: #fff;
  padding: 7px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`

const headerCenterStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;
  min-width: 0;
`

const headerAvatarStyle = css`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  font-family: 'Saira', sans-serif;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.35);
`

const headerInfoStyle = css`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const headerNameStyle = css`
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Saira', sans-serif;
`

const headerStatusStyle = css`
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
`

const messagesAreaStyle = css`
  flex-grow: 1;
  padding: 16px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const dateSeparatorStyle = css`
  display: flex;
  justify-content: center;
  margin: 4px 0 10px;

  span {
    background-color: rgba(0, 0, 0, 0.07);
    color: #666;
    font-size: 11px;
    padding: 3px 12px;
    border-radius: 10px;
  }
`

const bubbleWrapStyle = css`
  display: flex;
  margin-bottom: 1px;
`

const bubbleWrapOtherStyle = css`
  justify-content: flex-start;
`

const bubbleWrapUserStyle = css`
  justify-content: flex-end;
`

const baseBubbleStyle = css`
  max-width: 78%;
  padding: 7px 10px 5px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
`

const otherBubbleStyle = css`
  background-color: #fff;
  color: #222;
  border-radius: 2px 14px 14px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
`

const userBubbleStyle = css`
  background-color: #f60;
  color: #fff;
  border-radius: 14px 2px 14px 14px;
`

const timestampStyle = css`
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-end;
`

const timestampOtherStyle = css`
  color: #bbb;
`

const timestampUserStyle = css`
  color: rgba(255, 255, 255, 0.65);
`

const checkStyle = css`
  font-size: 10px;
  letter-spacing: -1px;
`

const typingBubbleStyle = css`
  background-color: #fff;
  border-radius: 2px 14px 14px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  padding: 11px 14px;
  display: flex;
  gap: 5px;
  align-items: center;
`

const dotStyle = css`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #ccc;
  display: inline-block;
`

const dot1Style = css`
  animation: ${bounceDot} 1.1s ease infinite;
  animation-delay: 0s;
`

const dot2Style = css`
  animation: ${bounceDot} 1.1s ease infinite;
  animation-delay: 0.18s;
`

const dot3Style = css`
  animation: ${bounceDot} 1.1s ease infinite;
  animation-delay: 0.36s;
`

const inputBarStyle = css`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px 10px 12px;
  background-color: #fff;
  border-top: 1px solid #efefef;
  position: fixed;
  bottom: 0;
  left: calc(50% - var(--max-width) / 2);
  width: 100%;
  max-width: var(--max-width);

  @media (max-width: 440px) {
    left: 0;
  }
`

const toolBtnStyle = css`
  background: none;
  border: none;
  color: #aaa;
  padding: 6px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:hover {
    background-color: #f3f4f6;
    color: #666;
  }
`

const textareaStyle = css`
  flex-grow: 1;
  border: none;
  background-color: #f3f4f6;
  border-radius: 22px;
  padding: 8px 14px;
  font-size: 14px;
  font-family: 'Open Sans', sans-serif;
  color: #333;
  resize: none;
  outline: none;
  line-height: 1.45;
  max-height: 120px;
  overflow-y: auto;

  &::placeholder {
    color: #bbb;
  }
`

const sendBtnStyle = css`
  background-color: #f60;
  border: none;
  color: #fff;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background-color: #e05500;
    color: #fff;
  }
`

const notFoundStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  font-size: 16px;
  color: #777;
`
