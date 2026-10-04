import { parseCampaign } from './campaign'

const CAMPAIGN_URL_KEY = 'ihunt.campaignUrl'
const HUNTER_ID_KEY = 'ihunt.hunterId'

export function readInvite(search) {
  const value = new URLSearchParams(search).get('campanha')
  if (!value) return null
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:' || protocol === 'http:' ? value : null
  } catch {
    return null
  }
}

function attempt(action) {
  try {
    return action()
  } catch {
    return null
  }
}

function safeStorage(storage) {
  const memory = new Map()
  return {
    get(key) {
      return attempt(() => storage.getItem(key)) ?? memory.get(key) ?? null
    },
    set(key, value) {
      memory.set(key, value)
      attempt(() => storage.setItem(key, value))
    },
    remove(key) {
      memory.delete(key)
      attempt(() => storage.removeItem(key))
    },
  }
}

export function createSync({ fetch, storage }) {
  const store = safeStorage(storage)

  async function read(url) {
    let response
    try {
      response = await fetch(url, { cache: 'no-store' })
    } catch (error) {
      return { status: 'error', error: error.message }
    }
    if (!response.ok) return { status: 'error', error: `HTTP ${response.status}` }

    let raw
    try {
      raw = JSON.parse(await response.text())
    } catch (error) {
      return { status: 'invalid', errors: [{ path: '', message: `JSON inválido: ${error.message}` }] }
    }

    const result = parseCampaign(raw)
    return result.ok
      ? { status: 'ready', campaign: result.campaign }
      : { status: 'invalid', errors: result.errors }
  }

  return {
    acceptInvite(url) {
      if (store.get(CAMPAIGN_URL_KEY) === url) return
      store.set(CAMPAIGN_URL_KEY, url)
      store.remove(HUNTER_ID_KEY)
    },
    getHunterId() {
      return store.get(HUNTER_ID_KEY)
    },
    setHunterId(hunterId) {
      store.set(HUNTER_ID_KEY, hunterId)
    },
    load() {
      const url = store.get(CAMPAIGN_URL_KEY)
      return url ? read(url) : Promise.resolve({ status: 'no-campaign' })
    },
  }
}
