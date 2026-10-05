import { describe, expect, it } from 'vitest'
import { addMinutes, relativeToCampaign, timeLeft } from './time'

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

describe('timeLeft', () => {
  it.each([
    ['2026-10-07T05:00:00-03:00', '2d 8h'],
    ['2026-10-05T21:00:00-03:00', '1d'],
    ['2026-10-04T23:30:00-03:00', '2h 30min'],
    ['2026-10-04T21:40:00-03:00', '40min'],
  ])('shows the time until %s as %s', (deadline, text) => {
    expect(timeLeft(deadline, CAMPAIGN_DATE)).toBe(text)
  })

  it('returns null once the deadline has passed', () => {
    expect(timeLeft('2026-10-04T20:00:00-03:00', CAMPAIGN_DATE)).toBeNull()
  })
})

describe('addMinutes', () => {
  it('keeps the time zone written in the campaign file', () => {
    expect(addMinutes(CAMPAIGN_DATE, 150)).toBe('2026-10-04T23:30:00-03:00')
    expect(addMinutes(CAMPAIGN_DATE, 24 * 60)).toBe('2026-10-05T21:00:00-03:00')
    expect(addMinutes('2026-10-04T21:00:00Z', 30)).toBe('2026-10-04T21:30:00Z')
  })
})
