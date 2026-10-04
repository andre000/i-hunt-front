import { describe, expect, it } from 'vitest'
import { homeView, missionDetail, missionList, visibleMissions } from './missions'
import { campaignWith, parsed, validCampaign } from './fixtures'

function statusOf(mission) {
  return visibleMissions(campaignWith(mission))[0].status
}

describe('homeView', () => {
  it('shows the featured mission and the missions near the hunter', () => {
    const view = homeView(parsed(), 'ana')

    expect(view.featured.id).toBe('m1')
    expect(view.nearby.map(m => m.id)).toEqual(['m2'])
    expect(view.available).toBe(3)
  })

  it('lists only missions near the chosen hunter', () => {
    const view = homeView(parsed(), 'beto')

    expect(view.nearby.map(m => m.id)).toEqual(['m2'])
  })

  it('uses the first featured mission when the GM marks more than one', () => {
    const raw = validCampaign()
    raw.missions[2].featured = true

    expect(homeView(parsed(raw), 'ana').featured.id).toBe('m1')
  })

  it('has no featured mission when none is marked', () => {
    const raw = validCampaign()
    raw.missions[0].featured = false

    const view = homeView(parsed(raw), 'ana')

    expect(view.featured).toBeNull()
    expect(view.nearby.map(m => m.id)).toEqual(['m1', 'm2'])
  })
})

describe('mission status', () => {
  it('is available with no hunters and no result', () => {
    expect(statusOf({})).toBe('available')
  })

  it('is in progress with hunters on it', () => {
    expect(statusOf({ hunters: ['ana'] })).toBe('in-progress')
  })

  it('is completed or failed when the GM sets the result', () => {
    expect(statusOf({ hunters: ['ana'], result: 'concluída' })).toBe('completed')
    expect(statusOf({ hunters: ['ana'], result: 'fracassada' })).toBe('failed')
  })

  it('is expired when an available mission passes its deadline on the campaign date', () => {
    expect(statusOf({ deadline: '2026-10-04T20:59:00-03:00' })).toBe('expired')
  })

  it('is still available before the deadline on the campaign date', () => {
    expect(statusOf({ deadline: '2026-10-04T21:01:00-03:00' })).toBe('available')
  })

  it('does not expire while hunters are on it', () => {
    expect(statusOf({ hunters: ['ana'], deadline: '2026-10-01T00:00:00-03:00' })).toBe('in-progress')
  })

  it('compares deadlines across time zones', () => {
    expect(statusOf({ deadline: '2026-10-04T23:30:00Z' })).toBe('expired')
    expect(statusOf({ deadline: '2026-10-05T00:30:00Z' })).toBe('available')
  })
})

describe('scheduled missions', () => {
  const campaign = () => campaignWith(
    { id: 'now', postedAt: '2026-10-04T20:00:00-03:00', featured: true, nearHunters: ['ana'] },
    { id: 'later', postedAt: '2026-10-04T22:00:00-03:00', featured: true, nearHunters: ['ana'] },
    { id: 'always' },
  )

  it('are hidden from the visible missions', () => {
    expect(visibleMissions(campaign()).map(m => m.id)).toEqual(['now', 'always'])
  })

  it('never become the featured mission or a nearby mission', () => {
    const raw = campaign()
    raw.missions[0].featured = false
    raw.missions[0].nearHunters = []

    const view = homeView(raw, 'ana')

    expect(view.featured).toBeNull()
    expect(view.nearby).toEqual([])
  })

  it('are not found in the mission detail', () => {
    expect(missionDetail(campaign(), 'later')).toBeNull()
    expect(missionDetail(campaign(), 'now').id).toBe('now')
  })

  it('are not counted', () => {
    expect(homeView(campaign(), 'ana').available).toBe(2)
  })
})

describe('home with mission status', () => {
  it('shows only open missions and counts only available ones', () => {
    const campaign = campaignWith(
      { id: 'done', featured: true, hunters: ['ana'], result: 'concluída', nearHunters: ['ana'] },
      { id: 'busy', hunters: ['beto'], nearHunters: ['ana'] },
      { id: 'late', deadline: '2026-10-01T00:00:00-03:00', nearHunters: ['ana'] },
      { id: 'open', featured: true, nearHunters: ['ana'] },
      { id: 'far' },
    )

    const view = homeView(campaign, 'ana')

    expect(view.featured.id).toBe('open')
    expect(view.nearby.map(m => m.id)).toEqual(['busy'])
    expect(view.available).toBe(2)
  })
})

describe('missionDetail', () => {
  it('shows the status and the names of the hunters on the mission', () => {
    const campaign = campaignWith({ id: 'm', hunters: ['beto', 'ana'] })

    expect(missionDetail(campaign, 'm')).toMatchObject({ status: 'in-progress', hunterNames: ['Beto', 'Ana'] })
  })

  it('returns null for an unknown mission', () => {
    expect(missionDetail(campaignWith({}), 'nada')).toBeNull()
  })
})

describe('missionList', () => {
  const campaign = () => campaignWith(
    { id: 'open-low', risk: 'baixo' },
    { id: 'busy-high', risk: 'alto', hunters: ['ana'] },
    { id: 'done-mid', risk: 'médio', hunters: ['ana'], result: 'concluída' },
    { id: 'late-high', risk: 'alto', deadline: '2026-10-01T00:00:00-03:00' },
    { id: 'later', risk: 'baixo', postedAt: '2026-10-05T00:00:00-03:00' },
  )
  const ids = (missions) => missions.map(m => m.id)

  it('lists every visible mission in the order of the JSON without filters', () => {
    expect(ids(missionList(campaign()))).toEqual(['open-low', 'busy-high', 'done-mid', 'late-high'])
  })

  it('filters by status', () => {
    expect(ids(missionList(campaign(), { statuses: ['expired'] }))).toEqual(['late-high'])
  })

  it('keeps missions matching any of the chosen statuses', () => {
    expect(ids(missionList(campaign(), { statuses: ['available', 'completed'] }))).toEqual(['open-low', 'done-mid'])
  })

  it('filters by risk', () => {
    expect(ids(missionList(campaign(), { risks: ['alto'] }))).toEqual(['busy-high', 'late-high'])
  })

  it('combines status and risk', () => {
    expect(ids(missionList(campaign(), { statuses: ['in-progress', 'available'], risks: ['alto'] }))).toEqual(['busy-high'])
  })

  it('never lists scheduled missions', () => {
    expect(ids(missionList(campaign(), { risks: ['baixo'] }))).toEqual(['open-low'])
  })

  it('returns nothing when no mission matches', () => {
    expect(missionList(campaign(), { statuses: ['failed'] })).toEqual([])
  })
})
