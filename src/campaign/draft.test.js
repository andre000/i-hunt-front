import { describe, expect, it } from 'vitest'
import { blankDraft, draftErrors, draftFile, draftFileName, draftFrom, readDraftText, updateCampaign } from './draft'
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

describe('draftFile', () => {
  const SCHEMA = 'https://ihunt.test/campaign.schema.json'

  it('starts with the $schema of the app', () => {
    const text = draftFile(draftFrom(validCampaign()), { schemaUrl: SCHEMA })

    expect(Object.keys(JSON.parse(text))[0]).toBe('$schema')
    expect(JSON.parse(text).$schema).toBe(SCHEMA)
  })

  it('replaces the $schema the file had', () => {
    const raw = { $schema: './campaign.schema.json', ...validCampaign() }

    const text = draftFile(draftFrom(raw), { schemaUrl: SCHEMA })

    expect(JSON.parse(text).$schema).toBe(SCHEMA)
  })

  it('is indented and keeps the campaign', () => {
    const text = draftFile(draftFrom(validCampaign()), { schemaUrl: SCHEMA })

    expect(text).toContain('\n  "campaign": {\n    "name": "Noite em Porto Alegre",')
    expect(JSON.parse(text).missions[2].name).toBe('Vampiro no bar')
  })
})

describe('draftFileName', () => {
  it('uses the name of the published file', () => {
    expect(draftFileName('https://pub-123.r2.dev/mesas/noites.json?v=2')).toBe('noites.json')
  })

  it('is campanha.json without a published file', () => {
    expect(draftFileName(null)).toBe('campanha.json')
  })
})

describe('blankDraft', () => {
  it('is a minimal campaign dated now, with the local time zone', () => {
    const now = new Date('2026-10-05T15:42:10Z')

    const draft = blankDraft(now)

    expect(draft.campaign.name).toBe('Nova campanha')
    expect(draft.campaign.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00([+-]\d{2}:\d{2}|Z)$/)
    expect(new Date(draft.campaign.date).getTime()).toBe(new Date('2026-10-05T15:42:00Z').getTime())
    expect(draft.hunters).toEqual([])
    expect(draftErrors(draft).map(error => error.path)).toEqual(['/hunters'])
  })
})

describe('readDraftText', () => {
  it('reads the JSON of a file', () => {
    expect(readDraftText(JSON.stringify(validCampaign())).draft.campaign.name).toBe('Noite em Porto Alegre')
  })

  it('explains when the file is not readable JSON', () => {
    expect(readDraftText('{ "campaign": ').error).toMatch(/^O arquivo não é um JSON legível/)
  })

  it('explains when the JSON is not an object', () => {
    expect(readDraftText('[1, 2]').error).toMatch(/^O arquivo não é um JSON legível/)
  })
})
