const CAMPAIGN_PATH = '/api/campanhas/'
const CAMPAIGN_NAME = /^[a-z0-9-]+\.json$/
const MAX_BYTES = 1024 * 1024

async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
}

async function sameSecret(given, expected) {
  const [a, b] = await Promise.all([digest(given), digest(expected)])
  return a.reduce((difference, byte, index) => difference | (byte ^ b[index]), 0) === 0
}

async function authorized(request, env) {
  const header = request.headers.get('Authorization') ?? ''
  if (!header.startsWith('Bearer ') || !env.PUBLISH_TOKEN) return false
  return sameSecret(header.slice('Bearer '.length), env.PUBLISH_TOKEN)
}

function json(body, status = 200) {
  return Response.json(body, { status })
}

function isJson(text) {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function historyPrefix(name) {
  return `historico/${name.slice(0, -'.json'.length)}/`
}

async function keepPrevious(bucket, name) {
  const previous = await bucket.get(name)
  if (!previous) return
  const copy = `${historyPrefix(name)}${new Date().toISOString()}.json`
  await bucket.put(copy, await previous.text(), { httpMetadata: { contentType: 'application/json' } })
}

async function publishCampaign(request, env, name) {
  if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401)
  if (!CAMPAIGN_NAME.test(name)) return json({ error: 'invalid' }, 400)
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return json({ error: 'too large' }, 413)
  const body = await request.arrayBuffer()
  if (body.byteLength > MAX_BYTES) return json({ error: 'too large' }, 413)
  const text = new TextDecoder().decode(body)
  if (!isJson(text)) return json({ error: 'invalid' }, 400)
  await keepPrevious(env.CAMPAIGNS, name)
  await env.CAMPAIGNS.put(name, text, { httpMetadata: { contentType: 'application/json' } })
  return json({ url: `${env.PUBLIC_BASE_URL}/${name}` })
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method !== 'PUT' || !pathname.startsWith(CAMPAIGN_PATH)) return json({ error: 'not found' }, 404)
    try {
      return await publishCampaign(request, env, pathname.slice(CAMPAIGN_PATH.length))
    } catch (error) {
      console.error(error)
      return json({ error: 'internal' }, 500)
    }
  },
}
