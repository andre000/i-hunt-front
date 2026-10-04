import { describe, expect, it } from 'vitest'
import { conversation, inbox, unreadTotal } from './messages'
import { parsed, validCampaign } from './fixtures'

describe('inbox', () => {
  it('groups the messages for the hunter by NPC, latest conversation first', () => {
    const conversations = inbox(parsed(), 'ana', [])

    expect(conversations.map(c => c.npc.id)).toEqual(['dona-rosa', 'padre'])
    expect(conversations[0].lastMessage.text).toBe('Ana, cuidado.')
    expect(conversations[1].lastMessage.text).toBe('Ana, venha à igreja.')
  })

  it('does not show messages sent only to other hunters', () => {
    const texts = inbox(parsed(), 'beto', []).map(c => c.lastMessage.text)

    expect(texts).toEqual(['Beto, só para você.'])
  })

  it('does not show scheduled messages', () => {
    const padre = inbox(parsed(), 'beto', []).find(c => c.npc.id === 'padre')

    expect(padre).toBeUndefined()
  })

  it('counts unread messages per conversation', () => {
    const conversations = inbox(parsed(), 'ana', ['msg1'])

    expect(conversations.map(c => c.unread)).toEqual([1, 1])
  })
})

describe('conversation', () => {
  it('lists the visible messages of one NPC in fiction-time order', () => {
    const { npc, messages } = conversation(parsed(), 'ana', 'dona-rosa')

    expect(npc.name).toBe('Dona Rosa')
    expect(messages.map(m => m.id)).toEqual(['msg1', 'msg4'])
  })

  it('orders by fiction time even when the JSON is out of order', () => {
    const raw = validCampaign()
    raw.messages.reverse()

    expect(conversation(parsed(raw), 'ana', 'dona-rosa').messages.map(m => m.id)).toEqual(['msg1', 'msg4'])
  })

  it('is null for an NPC with nothing visible to the hunter', () => {
    expect(conversation(parsed(), 'beto', 'padre')).toBeNull()
    expect(conversation(parsed(), 'ana', 'ninguem')).toBeNull()
  })
})

describe('unreadTotal', () => {
  it('counts the unread visible messages of the hunter', () => {
    expect(unreadTotal(parsed(), 'ana', [])).toBe(3)
    expect(unreadTotal(parsed(), 'ana', ['msg1', 'msg2', 'msg3'])).toBe(1)
  })
})
