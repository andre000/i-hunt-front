import { describe, expect, it } from 'vitest'
import { draftErrors, draftFrom, updateCampaign } from './draft'
import { validCampaign } from './fixtures'

describe('draftFrom', () => {
  it('keeps the campaign of a valid file', () => {
    const draft = draftFrom(validCampaign())

    expect(draft.campaign.name).toBe('Noite em Porto Alegre')
    expect(draft.hunters.map(hunter => hunter.name)).toEqual(['Ana', 'Beto'])
    expect(draftErrors(draft)).toEqual([])
  })
})

describe('a draft with validation errors', () => {
  it('opens a file with errors and lists them by path', () => {
    const raw = validCampaign()
    raw.missions[1].value = 'cem'

    const draft = draftFrom(raw)

    expect(draft.missions[1].value).toBe('cem')
    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/missions/1/value' }))
  })

  it('opens a file without sections as an empty campaign', () => {
    const draft = draftFrom({ campaign: { name: 'Nova' } })

    expect(draft.hunters).toEqual([])
    expect(draft.missions).toEqual([])
    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/campaign/date' }))
  })

  it('does not change the file it came from', () => {
    const raw = validCampaign()
    const draft = draftFrom(raw)

    draft.hunters[0].name = 'Outra'

    expect(raw.hunters[0].name).toBe('Ana')
  })
})

describe('updateCampaign', () => {
  it('renames the campaign without touching the rest', () => {
    const draft = updateCampaign(draftFrom(validCampaign()), { name: 'Noite em Pelotas' })

    expect(draft.campaign).toEqual({ name: 'Noite em Pelotas', date: '2026-10-04T21:00:00-03:00' })
    expect(draft.hunters).toHaveLength(2)
  })

  it('reports an empty name as an error', () => {
    const draft = updateCampaign(draftFrom(validCampaign()), { name: '' })

    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/campaign/name' }))
  })
})
