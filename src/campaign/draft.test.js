import { describe, expect, it } from 'vitest'
import { advanceToNextScheduled, blankDraft, dateFromInput, dateToInput, draftErrors, nextScheduled, draftFile, draftFileName, draftFrom, readDraftText, updateCampaign } from './draft'
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

describe('dates typed without a time zone', () => {
  const CAMPAIGN_DATE = '2026-10-04T21:00:00-03:00'

  it('shows a date as the time of the campaign zone', () => {
    expect(dateToInput('2026-10-05T03:30:00Z', CAMPAIGN_DATE)).toBe('2026-10-05T00:30')
  })

  it('keeps the time as written when the zone is the same', () => {
    expect(dateToInput('2026-10-04T21:00:00-03:00', CAMPAIGN_DATE)).toBe('2026-10-04T21:00')
  })

  it('stores a typed time with the zone of the campaign date', () => {
    expect(dateFromInput('2026-10-05T00:30', CAMPAIGN_DATE)).toBe('2026-10-05T00:30:00-03:00')
  })

  it('uses Z when the campaign date is in UTC', () => {
    expect(dateFromInput('2026-10-05T00:30', '2026-10-04T21:00:00Z')).toBe('2026-10-05T00:30:00Z')
  })

  it('shows an empty field for a missing or broken date', () => {
    expect(dateToInput(undefined, CAMPAIGN_DATE)).toBe('')
    expect(dateToInput('amanhã', CAMPAIGN_DATE)).toBe('')
  })

  it('stores nothing for an empty field', () => {
    expect(dateFromInput('', CAMPAIGN_DATE)).toBeUndefined()
  })
})

describe('next scheduled', () => {
  function draftWith({ missions = [], messages = [] }) {
    const raw = validCampaign()
    raw.missions.push(...missions.map((postedAt, index) => ({ id: `s${index}`, name: 'S', location: 'C', value: 1, risk: 'baixo', postedAt })))
    raw.messages = messages.map((sentAt, index) => ({ id: `n${index}`, npc: 'padre', to: 'all', sentAt, text: 'Oi' }))
    return draftFrom(raw)
  }

  it('is the earliest mission or message after the campaign date', () => {
    const draft = draftWith({
      missions: ['2026-10-05T02:00:00-03:00', '2026-10-04T20:00:00-03:00'],
      messages: ['2026-10-05T02:00:00Z', '2026-10-04T22:30:00-03:00'],
    })

    expect(nextScheduled(draft)).toBe('2026-10-04T22:30:00-03:00')
  })

  it('compares instants, not text, across time zones', () => {
    const draft = draftWith({ missions: ['2026-10-05T03:00:00Z'], messages: ['2026-10-05T01:00:00-03:00'] })

    expect(nextScheduled(draft)).toBe('2026-10-05T03:00:00Z')
  })

  it('is null when nothing is scheduled', () => {
    const draft = draftWith({ messages: ['2026-10-04T21:00:00-03:00'] })

    expect(nextScheduled(draft)).toBeNull()
  })

  it('advances the campaign date to it, in the campaign zone', () => {
    const draft = draftWith({ messages: ['2026-10-05T03:00:00Z'] })

    expect(advanceToNextScheduled(draft).campaign.date).toBe('2026-10-05T00:00:00-03:00')
  })

  it('advances to the exact second, so the item is no longer scheduled', () => {
    const draft = draftWith({ messages: ['2026-10-04T22:10:45-03:00'] })

    const advanced = advanceToNextScheduled(draft)

    expect(advanced.campaign.date).toBe('2026-10-04T22:10:45-03:00')
    expect(nextScheduled(advanced)).toBeNull()
  })

  it('leaves the draft alone when nothing is scheduled', () => {
    const draft = draftWith({})

    expect(advanceToNextScheduled(draft)).toBe(draft)
  })
})
