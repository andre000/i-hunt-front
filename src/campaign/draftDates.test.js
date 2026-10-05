import { describe, expect, it } from 'vitest'
import { dateFromInput, dateToInput } from './draftDates'

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
