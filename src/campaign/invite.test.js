import { describe, expect, it } from 'vitest'
import { inviteLink, readInvite } from './invite'

const CAMPAIGN_URL = 'https://pub-123.r2.dev/campanha.json'

describe('readInvite', () => {
  it('reads the campaign URL from the invite link', () => {
    expect(readInvite(`?campanha=${encodeURIComponent(CAMPAIGN_URL)}`)).toBe(CAMPAIGN_URL)
  })

  it('returns null without the invite parameter', () => {
    expect(readInvite('')).toBeNull()
    expect(readInvite('?outra=1')).toBeNull()
  })

  it.each(['javascript:alert(1)', 'ftp://x/c.json', 'nao-e-url'])('ignores %s', (url) => {
    expect(readInvite(`?campanha=${encodeURIComponent(url)}`)).toBeNull()
  })
})

describe('inviteLink', () => {
  it('builds a link that readInvite reads back', () => {
    const link = inviteLink('https://ihunt.example', CAMPAIGN_URL)

    expect(link).toBe(`https://ihunt.example/?campanha=${encodeURIComponent(CAMPAIGN_URL)}`)
    expect(readInvite(new URL(link).search)).toBe(CAMPAIGN_URL)
  })
})
