import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import worker from './index'
import { memoryBucket } from '../src/test/fakes'

const TOKEN = 'senha-do-gm'
const CAMPAIGN = '{"campaign":{"name":"Noite"}}'

function setup(objects) {
  return { CAMPAIGNS: memoryBucket(objects), PUBLISH_TOKEN: TOKEN, PUBLIC_BASE_URL: 'https://pub-123.r2.dev' }
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

  it('answers 404 for another method or another route under /api', async () => {
    const env = setup()

    expect((await publish(env, 'noites.json', { method: 'POST' })).status).toBe(404)
    const other = await worker.fetch(new Request('https://ihunt.test/api/outra'), env)
    expect(other.status).toBe(404)
    expect(env.CAMPAIGNS.keys()).toEqual([])
  })
})

describe('Routes of the app', () => {
  it('runs the Worker only for /api/* and keeps the rest as static assets', () => {
    const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))

    expect(config.assets.run_worker_first).toEqual(['/api/*'])
    expect(config.assets.not_found_handling).toBe('single-page-application')
  })
})
