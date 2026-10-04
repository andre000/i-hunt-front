import { describe, expect, it, vi } from 'vitest'
import { createSync, createSyncLoop, readInvite } from './sync'
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

function offline() {
  return async () => { throw new TypeError('Failed to fetch') }
}

function online(body, status = 200) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  })
}

function switchableFetch(initial) {
  let current = initial
  const fetch = vi.fn((...args) => current(...args))
  fetch.use = (next) => { current = next }
  return fetch
}

function renamed(name) {
  const raw = validCampaign()
  raw.campaign.name = name
  return raw
}

async function loadedSync(storage = memoryStorage()) {
  const fetch = switchableFetch(online(validCampaign()))
  const sync = createSync({ fetch, storage })
  sync.acceptInvite(CAMPAIGN_URL)
  await sync.load()
  return { sync, fetch, storage }
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

describe('keeping the last valid campaign', () => {
  it('shows new content the GM published', async () => {
    const { sync, fetch } = await loadedSync()

    fetch.use(online(renamed('Segunda sessão')))
    const result = await sync.load()

    expect(result).toMatchObject({ status: 'ready', offline: false, updateError: null, errors: [] })
    expect(result.campaign.campaign.name).toBe('Segunda sessão')
  })

  it('keeps the last valid version when the new JSON breaks the schema', async () => {
    const { sync, fetch } = await loadedSync()
    const broken = renamed('Quebrada')
    broken.missions[0].value = 'cem'

    fetch.use(online(broken))
    const result = await sync.load()

    expect(result.status).toBe('ready')
    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/missions/0/value' }))
  })

  it('keeps the last valid version when the new file is not JSON', async () => {
    const { sync, fetch } = await loadedSync()

    fetch.use(online('{ "campaign": '))
    const result = await sync.load()

    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
    expect(result.errors).toEqual([{ path: '', message: expect.stringMatching(/JSON/) }])
  })

  it('shows the last valid version offline', async () => {
    const { sync, fetch } = await loadedSync()

    fetch.use(offline())
    const result = await sync.load()

    expect(result).toMatchObject({ status: 'ready', offline: true, updateError: null })
    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
  })

  it('shows the last valid version when the server answers with an error', async () => {
    const { sync, fetch } = await loadedSync()

    fetch.use(online('erro', 500))
    const result = await sync.load()

    expect(result).toMatchObject({ status: 'ready', offline: false, updateError: 'HTTP 500' })
  })

  it('opens offline with the version saved in a previous session', async () => {
    const { storage } = await loadedSync()

    const reopened = createSync({ fetch: offline(), storage })
    const result = await reopened.load()

    expect(result).toMatchObject({ status: 'ready', offline: true })
    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
  })

  it('goes back online after being offline', async () => {
    const { sync, fetch } = await loadedSync()
    fetch.use(offline())
    await sync.load()

    fetch.use(online(renamed('De volta')))
    const result = await sync.load()

    expect(result).toMatchObject({ status: 'ready', offline: false })
    expect(result.campaign.campaign.name).toBe('De volta')
  })

  it('does not use the saved version of another campaign', async () => {
    const { sync, fetch } = await loadedSync()

    sync.acceptInvite('https://pub-123.r2.dev/outra.json')
    fetch.use(offline())

    expect(await sync.load()).toEqual({ status: 'error', error: 'Failed to fetch' })
  })
})

describe('offerInvite', () => {
  it('accepts the first invite', () => {
    const sync = createSync({ fetch: online({}), storage: memoryStorage() })

    expect(sync.offerInvite(CAMPAIGN_URL)).toBe('accepted')
  })

  it('accepts the invite of the campaign already saved', async () => {
    const { sync } = await loadedSync()
    sync.setHunterId('ana')

    expect(sync.offerInvite(CAMPAIGN_URL)).toBe('accepted')
    expect(sync.getHunterId()).toBe('ana')
  })

  it('asks before replacing a different campaign and changes nothing', async () => {
    const { sync, fetch } = await loadedSync()
    sync.setHunterId('ana')

    expect(sync.offerInvite('https://pub-123.r2.dev/outra.json')).toBe('needs-confirmation')

    await sync.load()
    expect(fetch).toHaveBeenLastCalledWith(CAMPAIGN_URL, { cache: 'no-store' })
    expect(sync.getHunterId()).toBe('ana')
  })
})

describe('createSyncLoop', () => {
  function fakeEnvironment() {
    const timers = []
    const returnHandlers = []
    return {
      timers,
      returnHandlers,
      setInterval: vi.fn((run, ms) => timers.push({ run, ms }) - 1),
      clearInterval: vi.fn((id) => { timers[id] = null }),
      onReturn: vi.fn((run) => {
        returnHandlers.push(run)
        return () => returnHandlers.splice(returnHandlers.indexOf(run), 1)
      }),
    }
  }

  function deferred() {
    let resolve
    const promise = new Promise(r => { resolve = r })
    return { promise, resolve }
  }

  it('loads right away and hands over the result', async () => {
    const env = fakeEnvironment()
    const onResult = vi.fn()
    const load = vi.fn(async () => ({ status: 'ready' }))

    createSyncLoop({ load, onResult, ...env }).start()
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith({ status: 'ready' }))

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('loads again every 30 seconds', async () => {
    const env = fakeEnvironment()
    const load = vi.fn(async () => ({}))
    createSyncLoop({ load, onResult: () => {}, ...env }).start()
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))

    expect(env.timers[0].ms).toBe(30000)
    env.timers[0].run()

    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })

  it('loads again when the player comes back to the app', async () => {
    const env = fakeEnvironment()
    const load = vi.fn(async () => ({}))
    createSyncLoop({ load, onResult: () => {}, ...env }).start()
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))

    env.returnHandlers[0]()

    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })

  it('does not start a second load while one is running', async () => {
    const env = fakeEnvironment()
    const pending = deferred()
    const load = vi.fn(() => pending.promise)
    const onResult = vi.fn()
    createSyncLoop({ load, onResult, ...env }).start()

    env.timers[0].run()
    env.returnHandlers[0]()
    pending.resolve({})
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('stops the timer and the return listener', async () => {
    const env = fakeEnvironment()
    const loop = createSyncLoop({ load: async () => ({}), onResult: () => {}, ...env })
    loop.start()

    loop.stop()

    expect(env.clearInterval).toHaveBeenCalledWith(0)
    expect(env.returnHandlers).toEqual([])
  })
})
