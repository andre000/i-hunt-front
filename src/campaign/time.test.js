import { describe, expect, it } from 'vitest'
import { relativeToCampaign } from './time'

const CAMPAIGN_DATE = '2026-10-04T21:00:00-03:00'

describe('relativeToCampaign', () => {
  it.each([
    ['2026-10-07T21:00:00-03:00', 'em 3 dias'],
    ['2026-10-06T21:00:00-03:00', 'depois de amanhã'],
    ['2026-10-05T21:00:00-03:00', 'amanhã'],
    ['2026-10-04T23:00:00-03:00', 'em 2 horas'],
    ['2026-10-04T20:30:00-03:00', 'há 30 minutos'],
    ['2026-10-01T21:00:00-03:00', 'há 3 dias'],
  ])('describes %s relative to the campaign date', (date, text) => {
    expect(relativeToCampaign(date, CAMPAIGN_DATE)).toBe(text)
  })
})
