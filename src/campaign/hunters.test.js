import { describe, expect, it } from 'vitest'
import { findHunter, hunterProfile } from './hunters'
import { campaignWith, parsed, validCampaign } from './fixtures'

describe('findHunter', () => {
  it('finds a hunter by id', () => {
    expect(findHunter(parsed(), 'beto').name).toBe('Beto')
  })

  it('returns null for unknown or missing ids', () => {
    const campaign = parsed()

    expect(findHunter(campaign, 'carla')).toBeNull()
    expect(findHunter(campaign, null)).toBeNull()
  })
})

describe('hunterProfile', () => {
  const campaign = () => campaignWith(
    { id: 'solo', value: 300, hunters: ['ana'], result: 'concluída' },
    { id: 'split', value: 500, hunters: ['ana', 'beto'], result: 'concluída' },
    { id: 'lost', value: 1000, hunters: ['ana'], result: 'fracassada' },
    { id: 'busy', value: 200, hunters: ['ana', 'beto'] },
    { id: 'other', value: 900, hunters: ['beto'], result: 'concluída' },
    { id: 'future', value: 700, hunters: ['ana'], result: 'concluída', postedAt: '2026-10-05T00:00:00-03:00' },
  )

  it('shows the chosen hunter', () => {
    expect(hunterProfile(campaign(), 'ana').hunter).toMatchObject({ name: 'Ana', rating: 4.5 })
  })

  it('splits the value of each completed mission among its hunters', () => {
    expect(hunterProfile(campaign(), 'ana').earnings).toBe(300 + 250)
    expect(hunterProfile(campaign(), 'beto').earnings).toBe(250 + 900)
  })

  it('separates missions in progress from completed ones', () => {
    const profile = hunterProfile(campaign(), 'ana')

    expect(profile.inProgress.map(m => m.id)).toEqual(['busy'])
    expect(profile.completed.map(m => m.id)).toEqual(['solo', 'split'])
  })

  it('has no earnings or missions for a hunter on no mission', () => {
    const raw = validCampaign()
    raw.hunters.push({ id: 'carla', name: 'Carla' })

    expect(hunterProfile(parsed(raw), 'carla')).toMatchObject({ earnings: 0, inProgress: [], completed: [] })
  })

  it('is null for an unknown hunter', () => {
    expect(hunterProfile(campaign(), 'zeca')).toBeNull()
  })
})
