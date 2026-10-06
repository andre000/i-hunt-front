const CAMPAIGN_PATH = '/api/campanhas/'
const CAMPAIGN_NAME = /^[a-z0-9-]+\.json$/

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

async function publishCampaign(request, env, name) {
  if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401)
  if (!CAMPAIGN_NAME.test(name)) return json({ error: 'invalid' }, 400)
  await env.CAMPAIGNS.put(name, await request.text(), { httpMetadata: { contentType: 'application/json' } })
  return json({ url: `${env.PUBLIC_BASE_URL}/${name}` })
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method === 'PUT' && pathname.startsWith(CAMPAIGN_PATH)) {
      return publishCampaign(request, env, pathname.slice(CAMPAIGN_PATH.length))
    }
    return json({ error: 'not found' }, 404)
  },
}
