/** @jsxImportSource @emotion/react */
import { createLazyFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { useState } from 'react'
import { css } from '@emotion/react'

export const Route = createLazyFileRoute('/chat/')({
  component: ChatPage,
})

function ChatPage() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Ol\u00e1! Esta \u00e9 a sala de chat.' },
    { from: 'bot', text: 'Envie sua primeira mensagem!' },
    { from: 'user', text: 'Oi, vamos conversar?' },
  ])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages([...messages, { from: 'user', text: trimmed }])
    setText('')
  }

  return (
    <main className='app-main'>
      <Header />
      <div className='app-body' css={chatBody}>
        <ul className='messages'>
          {messages.map((m, idx) => (
            <li key={idx} className={m.from === 'user' ? 'user' : 'bot'}>
              {m.text}
            </li>
          ))}
        </ul>
        <form className='input-area' onSubmit={handleSubmit}>
          <input
            type='text'
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Digite sua mensagem...'
          />
          <button type='submit' className='button primary'>Enviar</button>
        </form>
      </div>
      <Footer active='chat' />
    </main>
  )
}

const chatBody = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;

  .messages {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
  }

  .messages li {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.3;
  }

  .messages li.bot {
    background-color: #eee;
    align-self: flex-start;
    border-radius: 16px 16px 16px 0;
  }

  .messages li.user {
    background-color: #f60;
    color: #fff;
    align-self: flex-end;
    border-radius: 16px 16px 0 16px;
  }

  .input-area {
    display: flex;
    gap: 8px;

    input {
      flex-grow: 1;
      border: 1px solid #ccc;
      border-radius: 16px;
      padding: 8px 12px;
    }
  }
`

