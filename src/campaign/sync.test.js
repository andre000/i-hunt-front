import { describe, expect, it, vi } from 'vitest'
import { createSync, readInvite } from './sync'
import { validCampaign } from './fixtures'

const CAMPAIGN_URL = 'https://pub-123.r2.dev/campanha.json'

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  }
}

function brokenStorage() {
  const fail = () => { throw new Error('SecurityError') }
  return { getItem: fail, setItem: fail, removeItem: fail }
}

function respondWith(body, { status = 200 } = {}) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }))
}

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

describe('createSync', () => {
  it('reports no campaign when no invite was ever accepted', async () => {
    const fetch = respondWith(validCampaign())
    const sync = createSync({ fetch, storage: memoryStorage() })

    expect(await sync.load()).toEqual({ status: 'no-campaign' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('loads the campaign from the accepted invite without using the HTTP cache', async () => {
    const fetch = respondWith(validCampaign())
    const sync = createSync({ fetch, storage: memoryStorage() })

    sync.acceptInvite(CAMPAIGN_URL)
    const result = await sync.load()

    expect(fetch).toHaveBeenCalledWith(CAMPAIGN_URL, { cache: 'no-store' })
    expect(result.status).toBe('ready')
    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
  })

  it('remembers the campaign across app openings', async () => {
    const storage = memoryStorage()
    createSync({ fetch: respondWith(validCampaign()), storage }).acceptInvite(CAMPAIGN_URL)

    const reopened = createSync({ fetch: respondWith(validCampaign()), storage })

    expect((await reopened.load()).status).toBe('ready')
  })

  it('remembers the chosen hunter', () => {
    const storage = memoryStorage()
    createSync({ fetch: respondWith({}), storage }).setHunterId('ana')

    expect(createSync({ fetch: respondWith({}), storage }).getHunterId()).toBe('ana')
  })

  it('forgets the hunter when a different campaign is accepted', () => {
    const sync = createSync({ fetch: respondWith({}), storage: memoryStorage() })
    sync.acceptInvite(CAMPAIGN_URL)
    sync.setHunterId('ana')

    sync.acceptInvite('https://pub-123.r2.dev/outra.json')

    expect(sync.getHunterId()).toBeNull()
  })

  it('keeps the hunter when the same invite is opened again', () => {
    const sync = createSync({ fetch: respondWith({}), storage: memoryStorage() })
    sync.acceptInvite(CAMPAIGN_URL)
    sync.setHunterId('ana')

    sync.acceptInvite(CAMPAIGN_URL)

    expect(sync.getHunterId()).toBe('ana')
  })

  it('reports an HTTP error', async () => {
    const sync = createSync({ fetch: respondWith('Not Found', { status: 404 }), storage: memoryStorage() })
    sync.acceptInvite(CAMPAIGN_URL)

    expect(await sync.load()).toEqual({ status: 'error', error: 'HTTP 404' })
  })

  it('reports a network failure', async () => {
    const fetch = vi.fn(async () => { throw new TypeError('Failed to fetch') })
    const sync = createSync({ fetch, storage: memoryStorage() })
    sync.acceptInvite(CAMPAIGN_URL)

    expect(await sync.load()).toEqual({ status: 'error', error: 'Failed to fetch' })
  })

  it('reports a file that is not JSON', async () => {
    const sync = createSync({ fetch: respondWith('{ "campaign": '), storage: memoryStorage() })
    sync.acceptInvite(CAMPAIGN_URL)

    const result = await sync.load()

    expect(result.status).toBe('invalid')
    expect(result.errors).toEqual([{ path: '', message: expect.stringMatching(/JSON/) }])
  })

  it('reports a JSON that breaks the schema', async () => {
    const raw = validCampaign()
    raw.missions[0].value = 'cem'
    const sync = createSync({ fetch: respondWith(raw), storage: memoryStorage() })
    sync.acceptInvite(CAMPAIGN_URL)

    const result = await sync.load()

    expect(result.status).toBe('invalid')
    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/missions/0/value' }))
  })

  it('keeps working for the session when storage throws', async () => {
    const sync = createSync({ fetch: respondWith(validCampaign()), storage: brokenStorage() })

    expect(sync.getHunterId()).toBeNull()
    expect(() => sync.acceptInvite(CAMPAIGN_URL)).not.toThrow()
    expect(() => sync.setHunterId('ana')).not.toThrow()
    expect(sync.getHunterId()).toBe('ana')
    expect((await sync.load()).status).toBe('ready')
  })
})
