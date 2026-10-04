import { describe, expect, it } from 'vitest'
import { gmView } from './gm'
import { campaignWith } from './fixtures'

describe('gmView', () => {
  const campaign = () => campaignWith(
    { id: 'done', value: 400, hunters: ['ana', 'beto'], result: 'concluída' },
    { id: 'open' },
    { id: 'later', postedAt: '2026-10-05T10:00:00-03:00', hunters: ['ana'], result: 'concluída', value: 1000 },
  )

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

  it('lists every mission with status, including scheduled ones marked as such', () => {
    const { missions } = gmView(campaign())

    expect(missions.map(m => [m.id, m.status, m.scheduled])).toEqual([
      ['done', 'completed', false],
      ['open', 'available', false],
      ['later', 'completed', true],
    ])
  })
})
