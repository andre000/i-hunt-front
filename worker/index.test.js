import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import worker from './index'
import { memoryBucket } from '../src/test/fakes'

const TOKEN = 'senha-do-gm'
const CAMPAIGN = '{"campaign":{"name":"Noite"}}'

function setup(objects) {
  return { CAMPAIGNS: memoryBucket(objects), PUBLISH_TOKEN: TOKEN, PUBLIC_BASE_URL: 'https://pub-123.r2.dev' }
}

function historyOf(campaign, count) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [
      `historico/${campaign}/2026-09-${String(index + 1).padStart(2, '0')}T00:00:00.000Z.json`,
      `{"version":${index}}`,
    ]),
  )
}

function historyKeys(env, campaign) {
  return env.CAMPAIGNS.keys().filter((key) => key.startsWith(`historico/${campaign}/`))
}

function publish(env, name, { token = TOKEN, body = CAMPAIGN, method = 'PUT' } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return worker.fetch(new Request(`https://ihunt.test/api/campanhas/${name}`, { method, headers, body }), env)
}

describe('Publishing a campaign', () => {
  it('stores the campaign as JSON and answers with its public address', async () => {
    const env = setup()

    const response = await publish(env, 'noites.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: 'https://pub-123.r2.dev/noites.json' })
    const stored = await env.CAMPAIGNS.get('noites.json')
    expect(await stored.text()).toBe(CAMPAIGN)
    expect(stored.httpMetadata.contentType).toBe('application/json')
  })

  it('replaces the campaign already published', async () => {
    const env = setup({ 'noites.json': '{"old":true}' })

    await publish(env, 'noites.json')

    expect(await (await env.CAMPAIGNS.get('noites.json')).text()).toBe(CAMPAIGN)
  })

  it.each([
    ['without a password', null],
    ['with a wrong password', 'chute'],
    ['with a password that only starts right', `${TOKEN}x`],
  ])('refuses %s and stores nothing', async (_, token) => {
    const env = setup()

    const response = await publish(env, 'noites.json', { token })

    expect(response.status).toBe(401)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })

  it.each([
    'historico/noites/2026.json',
    '..%2Fnoites.json',
    'Noites.json',
    'noites.txt',
    'noites',
    '.json',
  ])('refuses the name %s and stores nothing', async (name) => {
    const env = setup()

    const response = await publish(env, name)

    expect(response.status).toBe(400)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })

  it('never stores a name that climbs out with ../, since the address drops it before the route', async () => {
    const env = setup()

    const response = await publish(env, '../noites.json')

    expect(response.status).toBe(404)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })

  it('refuses a body above 1 MB and stores nothing', async () => {
    const env = setup()
    const body = JSON.stringify({ notes: 'x'.repeat(1024 * 1024) })

    const response = await publish(env, 'noites.json', { body })

    expect(response.status).toBe(413)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })

  it('accepts a body of exactly 1 MB', async () => {
    const env = setup()
    const body = JSON.stringify('x'.repeat(1024 * 1024 - 2))

    const response = await publish(env, 'noites.json', { body })

    expect(response.status).toBe(200)
  })

  it('refuses a body that is not JSON and stores nothing', async () => {
    const env = setup()

    const response = await publish(env, 'noites.json', { body: '<html>' })

    expect(response.status).toBe(400)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })

  it('answers 500 without inner details when something unexpected breaks', async () => {
    const env = setup()
    env.CAMPAIGNS.put = async () => { throw new Error('bucket secreto caiu') }
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await publish(env, 'noites.json')

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('secreto')
  })

  it('answers 404 for another method or another route under /api', async () => {
    const env = setup()

    expect((await publish(env, 'noites.json', { method: 'POST' })).status).toBe(404)
    const other = await worker.fetch(new Request('https://ihunt.test/api/outra'), env)
    expect(other.status).toBe(404)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })
})

describe('History before overwriting', () => {
  const NOW = '2026-10-07T21:30:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => vi.useRealTimers())

  it('copies the previous version into the campaign history, dated, before replacing it', async () => {
    const env = setup({ 'noites.json': '{"old":true}' })

    const response = await publish(env, 'noites.json')

    expect(response.status).toBe(200)
    const copy = await env.CAMPAIGNS.get(`historico/noites/${NOW}.json`)
    expect(await copy.text()).toBe('{"old":true}')
    expect(copy.httpMetadata.contentType).toBe('application/json')
    expect(await (await env.CAMPAIGNS.get('noites.json')).text()).toBe(CAMPAIGN)
  })

  it('creates no copy on the first publish of a new campaign', async () => {
    const env = setup()

    await publish(env, 'noites.json')

    expect(env.CAMPAIGNS.keys()).toEqual(['noites.json'])
  })

  it.each([
    ['a wrong password', { token: 'chute' }],
    ['a body that is not JSON', { body: '<html>' }],
    ['a body above 1 MB', { body: JSON.stringify({ notes: 'x'.repeat(1024 * 1024) }) }],
  ])('creates no copy when publishing is refused for %s', async (_, options) => {
    const env = setup({ 'noites.json': '{"old":true}' })

    await publish(env, 'noites.json', options)

    expect(env.CAMPAIGNS.keys()).toEqual(['noites.json'])
  })

  it('keeps the old campaign when the copy cannot be stored', async () => {
    const env = setup({ 'noites.json': '{"old":true}' })
    const put = env.CAMPAIGNS.put
    env.CAMPAIGNS.put = async (key, ...rest) => {
      if (key.startsWith('historico/')) throw new Error('falhou')
      return put(key, ...rest)
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await publish(env, 'noites.json')

    expect(response.status).toBe(500)
    expect(await (await env.CAMPAIGNS.get('noites.json')).text()).toBe('{"old":true}')
  })
  it('keeps only the 20 newest copies of the campaign', async () => {
    const env = setup({ 'noites.json': '{"old":true}', ...historyOf('noites', 20) })

    await publish(env, 'noites.json')

    const keys = historyKeys(env, 'noites')
    expect(keys).toHaveLength(20)
    expect(keys).not.toContain('historico/noites/2026-09-01T00:00:00.000Z.json')
    expect(keys).toContain('historico/noites/2026-09-02T00:00:00.000Z.json')
    expect(keys).toContain(`historico/noites/${NOW}.json`)
  })

  it('deletes nothing while the campaign has fewer than 20 copies', async () => {
    const env = setup({ 'noites.json': '{"old":true}', ...historyOf('noites', 5) })

    await publish(env, 'noites.json')

    expect(historyKeys(env, 'noites')).toHaveLength(6)
  })

  it('never touches another campaign or its history, even with a name that starts the same', async () => {
    const other = { 'noites-2.json': '{"other":true}', ...historyOf('noites-2', 20) }
    const env = setup({ 'noites.json': '{"old":true}', ...historyOf('noites', 20), ...other })

    await publish(env, 'noites.json')

    for (const [key, body] of Object.entries(other)) {
      expect(await (await env.CAMPAIGNS.get(key)).text()).toBe(body)
    }
  })
})

describe('Routes of the app', () => {
  it('runs the Worker only for /api/* and keeps the rest as static assets', () => {
    const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))

    expect(config.assets.run_worker_first).toEqual(['/api/*'])
    expect(config.assets.not_found_handling).toBe('single-page-application')
  })
})
