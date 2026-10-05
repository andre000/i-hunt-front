import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { clearDemo, createDemoSync, isDemoActive, LAST_NIGHT, shiftDate, startDemo } from './demoSync'
import { memoryStorage, respondWith } from '../test/fakes'

const example = JSON.parse(readFileSync(new URL('../../public/exemplo-campanha.json', import.meta.url), 'utf8'))
const ORIGIN = 'https://ihunt.test'

function demoSync({ storage = memoryStorage(), fetch = respondWith(example) } = {}) {
  return { sync: createDemoSync({ fetch, storage, origin: ORIGIN }), storage }
}

describe('shiftDate', () => {
  it('adds hours and keeps the original time zone', () => {
    expect(shiftDate('2026-10-10T22:00:00-03:00', 24)).toBe('2026-10-11T22:00:00-03:00')
    expect(shiftDate('2026-10-10T22:00:00-03:00', 60)).toBe('2026-10-13T10:00:00-03:00')
    expect(shiftDate('2026-10-10T22:00:00Z', 0)).toBe('2026-10-10T22:00:00Z')
  })
})

describe('createDemoSync', () => {
  it('loads the example campaign from the app origin', async () => {
    const calls = []
    const fetch = async (url, options) => { calls.push(url); return respondWith(example)(url, options) }
    const { sync } = demoSync({ fetch })

    const result = await sync.load()

    expect(result.status).toBe('ready')
    expect(result.campaign.campaign.name).toBe('Noites de Porto Alegre')
    expect(calls).toEqual(['https://ihunt.test/exemplo-campanha.json'])
  })

  it('moves the campaign date forward each night and stops at the last one', async () => {
    const { sync } = demoSync()

    expect((await sync.load()).campaign.campaign.date).toBe('2026-10-10T22:00:00-03:00')
    expect(sync.advanceNight()).toBe(2)
    expect((await sync.load()).campaign.campaign.date).toBe('2026-10-11T22:00:00-03:00')
    expect(sync.advanceNight()).toBe(3)
    expect(sync.advanceNight()).toBe(LAST_NIGHT)
    expect((await sync.load()).campaign.campaign.date).toBe('2026-10-13T10:00:00-03:00')
  })

  it.each(['abc', '9', '0'])('treats a stored night of %s as a valid night', async (stored) => {
    const { sync } = demoSync({ storage: memoryStorage({ 'ihunt.demo.night': stored }) })

    expect([1, LAST_NIGHT]).toContain(sync.getNight())
    expect((await sync.load()).status).toBe('ready')
  })

  it('keeps hunter and read messages only in demo keys', () => {
    const { sync, storage } = demoSync()

    sync.setHunterId('ana')
    sync.markMessagesRead(['rosa-1'])

    expect(sync.getHunterId()).toBe('ana')
    expect(sync.getReadMessageIds()).toEqual(['rosa-1'])
    expect(storage.keys().every(key => key.startsWith('ihunt.demo.'))).toBe(true)
  })

  it('restarts at the first night without hunter or read messages', () => {
    const { sync } = demoSync()
    sync.setHunterId('ana')
    sync.markMessagesRead(['rosa-1'])
    sync.advanceNight()

    sync.restart()

    expect(sync.getNight()).toBe(1)
    expect(sync.getHunterId()).toBeNull()
    expect(sync.getReadMessageIds()).toEqual([])
  })

  it('removes every demo key on exit and leaves other keys alone', () => {
    const storage = memoryStorage({ 'ihunt.campaignUrl': 'https://r2/real.json' })
    const { sync } = demoSync({ storage })
    startDemo(storage)
    sync.setHunterId('ana')
    sync.markIntroSeen()

    sync.exit()

    expect(storage.keys()).toEqual(['ihunt.campaignUrl'])
    expect(isDemoActive(storage)).toBe(false)
  })

  it('uses the last saved example when the network fails', async () => {
    const storage = memoryStorage()
    await demoSync({ storage }).sync.load()

    const offline = async () => { throw new TypeError('Failed to fetch') }
    const result = await demoSync({ storage, fetch: offline }).sync.load()

    expect(result.status).toBe('ready')
    expect(result.offline).toBe(true)
  })

  it('reports an error when the network fails and nothing was saved', async () => {
    const offline = async () => { throw new TypeError('Failed to fetch') }

    expect((await demoSync({ fetch: offline }).sync.load()).status).toBe('error')
  })

  it('remembers that the intro was seen', () => {
    const { sync } = demoSync()

    expect(sync.hasSeenIntro()).toBe(false)
    sync.markIntroSeen()
    expect(sync.hasSeenIntro()).toBe(true)
  })
})

describe('demo flag', () => {
  it('starts, reports and clears the demo', () => {
    const storage = memoryStorage()

    startDemo(storage)
    expect(isDemoActive(storage)).toBe(true)
    clearDemo(storage)
    expect(isDemoActive(storage)).toBe(false)
  })
})
