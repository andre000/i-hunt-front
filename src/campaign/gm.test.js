import { describe, expect, it } from 'vitest'
import { gmView } from './gm'
import { campaignWith, parsed } from './fixtures'

describe('gmView', () => {
  const campaign = () => campaignWith(
    { id: 'done', value: 400, hunters: ['ana', 'beto'], result: 'concluída' },
    { id: 'open', nearHunters: ['beto'] },
    { id: 'posted', postedAt: '2026-10-04T18:30:00-03:00' },
    { id: 'later', postedAt: '2026-10-05T10:00:00-03:00', hunters: ['ana'], result: 'concluída', value: 1000 },
  )

  const ids = items => items.map(item => item.id)

  it('shows the campaign date', () => {
    expect(gmView(campaign()).date).toBe('2026-10-04T21:00:00-03:00')
  })

  it('lists every hunter with rating and earnings', () => {
    const { hunters } = gmView(campaign())

    expect(hunters.map(({ hunter, earnings }) => [hunter.id, hunter.rating, earnings])).toEqual([
      ['ana', 4.5, 200],
      ['beto', undefined, 200],
    ])
  })

  it('counts sent and scheduled messages of each NPC', () => {
    const { npcs } = gmView(campaign())

    expect(npcs.map(({ npc, sent, scheduled }) => [npc.id, sent, scheduled])).toEqual([
      ['dona-rosa', 3, 0],
      ['padre', 1, 1],
    ])
  })

  it('puts missions and messages on one timeline split at the campaign date', () => {
    const { timeline } = gmView(campaign())

    expect(ids(timeline.origin)).toEqual(['mission:done', 'mission:open'])
    expect(ids(timeline.past)).toEqual([
      'message:msg1', 'mission:posted', 'message:msg2', 'message:msg3', 'message:msg4',
    ])
    expect(ids(timeline.upcoming)).toEqual(['message:msg5', 'mission:later'])
  })

  it('keeps the mission status and names who receives each message', () => {
    const { timeline } = gmView(campaign())
    const later = timeline.upcoming.find(item => item.id === 'mission:later')
    const toAna = timeline.past.find(item => item.id === 'message:msg2')
    const toAll = timeline.past.find(item => item.id === 'message:msg1')

    expect([later.mission.status, later.scheduled]).toEqual(['completed', true])
    expect([toAna.npc.name, toAna.recipients]).toEqual(['Padre Júlio', ['Ana']])
    expect(toAll.recipients).toBeNull()
  })

  it('shows only what reaches one hunter when filtered', () => {
    const { timeline } = gmView(campaign(), { hunterId: 'beto' })

    expect(ids(timeline.origin)).toEqual(['mission:done', 'mission:open'])
    expect(ids(timeline.past)).toEqual(['message:msg1', 'message:msg3'])
    expect(ids(timeline.upcoming)).toEqual(['message:msg5'])
  })

  it('handles a campaign without messages', () => {
    const raw = { ...parsed(), messages: [] }

    expect(gmView(raw).timeline.past.every(item => item.kind === 'mission')).toBe(true)
  })
})
