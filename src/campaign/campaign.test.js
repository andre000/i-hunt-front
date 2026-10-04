import { describe, expect, it } from 'vitest'
import { findHunter, findMission, homeView, parseCampaign } from './campaign'
import { validCampaign } from './fixtures'

function parsed(raw = validCampaign()) {
  const result = parseCampaign(raw)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.campaign
}

describe('parseCampaign', () => {
  it('accepts a valid campaign', () => {
    const result = parseCampaign(validCampaign())

    expect(result.ok).toBe(true)
    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
    expect(result.campaign.hunters.map(h => h.id)).toEqual(['ana', 'beto'])
  })

  it('fills optional mission fields with defaults', () => {
    const vampire = parsed().missions.find(m => m.id === 'm3')

    expect(vampire).toMatchObject({ description: '', tags: [], featured: false, nearHunters: [] })
  })

  it('does not change the raw input', () => {
    const raw = validCampaign()
    parseCampaign(raw)

    expect(raw.missions[2]).not.toHaveProperty('tags')
  })

  it('reports a missing top-level field', () => {
    const raw = validCampaign()
    delete raw.hunters

    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/hunters' }))
  })

  it('reports a wrong field type with its path', () => {
    const raw = validCampaign()
    raw.missions[1].value = 'cem'

    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/missions/1/value' }))
  })

  it('reports a risk outside the allowed values', () => {
    const raw = validCampaign()
    raw.missions[0].risk = 'extremo'

    const result = parseCampaign(raw)

    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/missions/0/risk' }))
  })

  it('reports an invalid campaign date', () => {
    const raw = validCampaign()
    raw.campaign.date = 'amanhã'

    const result = parseCampaign(raw)

    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/campaign/date' }))
  })

  it('reports a mission near a hunter that does not exist', () => {
    const raw = validCampaign()
    raw.missions[1].nearHunters = ['ana', 'carla']

    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      { path: '/missions/1/nearHunters/1', message: 'hunter "carla" não existe em /hunters' },
    ])
  })

  it.each([null, 'texto', 42, []])('rejects %j as a campaign', (raw) => {
    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('homeView', () => {
  it('shows the featured mission and the missions near the hunter', () => {
    const view = homeView(parsed(), 'ana')

    expect(view.featured.id).toBe('m1')
    expect(view.nearby.map(m => m.id)).toEqual(['m2'])
    expect(view.total).toBe(3)
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

describe('findHunter and findMission', () => {
  it('find by id', () => {
    const campaign = parsed()

    expect(findHunter(campaign, 'beto').name).toBe('Beto')
    expect(findMission(campaign, 'm2').name).toBe('Fantasma no ônibus T5')
  })

  it('return null for unknown or missing ids', () => {
    const campaign = parsed()

    expect(findHunter(campaign, 'carla')).toBeNull()
    expect(findHunter(campaign, null)).toBeNull()
    expect(findMission(campaign, 'm9')).toBeNull()
  })
})
