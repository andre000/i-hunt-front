import { parseCampaign } from './campaign'

const CAMPAIGN_URL_KEY = 'ihunt.campaignUrl'
const HUNTER_ID_KEY = 'ihunt.hunterId'
const LAST_CAMPAIGN_KEY = 'ihunt.lastCampaign'

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

  async function fetchCampaign(url) {
    let response
    try {
      response = await fetch(url, { cache: 'no-store' })
    } catch (error) {
      return { failure: 'offline', error: error.message }
    }
    if (!response.ok) return { failure: 'http', error: `HTTP ${response.status}` }

    let raw
    try {
      raw = JSON.parse(await response.text())
    } catch (error) {
      return { failure: 'invalid', errors: [{ path: '', message: `JSON inválido: ${error.message}` }] }
    }

    const result = parseCampaign(raw)
    return result.ok
      ? { raw, campaign: result.campaign }
      : { failure: 'invalid', errors: result.errors }
  }

  function lastValidCampaign(url) {
    const saved = attempt(() => JSON.parse(store.get(LAST_CAMPAIGN_KEY)))
    if (saved?.url !== url) return null
    const result = parseCampaign(saved.raw)
    return result.ok ? result.campaign : null
  }

  async function load(url) {
    const fetched = await fetchCampaign(url)

    if (!fetched.failure) {
      store.set(LAST_CAMPAIGN_KEY, JSON.stringify({ url, raw: fetched.raw }))
      return { status: 'ready', campaign: fetched.campaign, offline: false, updateError: null, errors: [] }
    }

    const last = lastValidCampaign(url)
    if (!last) {
      return fetched.failure === 'invalid'
        ? { status: 'invalid', errors: fetched.errors }
        : { status: 'error', error: fetched.error }
    }

    return {
      status: 'ready',
      campaign: last,
      offline: fetched.failure === 'offline',
      updateError: fetched.failure === 'http' ? fetched.error : null,
      errors: fetched.errors ?? [],
    }
  }

  function acceptInvite(url) {
    if (store.get(CAMPAIGN_URL_KEY) === url) return
    store.set(CAMPAIGN_URL_KEY, url)
    store.remove(HUNTER_ID_KEY)
    store.remove(LAST_CAMPAIGN_KEY)
  }

  return {
    acceptInvite,
    offerInvite(url) {
      const current = store.get(CAMPAIGN_URL_KEY)
      if (current && current !== url) return 'needs-confirmation'
      acceptInvite(url)
      return 'accepted'
    },
    getHunterId() {
      return store.get(HUNTER_ID_KEY)
    },
    setHunterId(hunterId) {
      store.set(HUNTER_ID_KEY, hunterId)
    },
    load() {
      const url = store.get(CAMPAIGN_URL_KEY)
      return url ? load(url) : Promise.resolve({ status: 'no-campaign' })
    },
  }
}

export function createSyncLoop({ load, onResult, setInterval, clearInterval, onReturn, intervalMs = 30000 }) {
  let running = false
  let timer = null
  let stopListening = null

  async function run() {
    if (running) return
    running = true
    try {
      onResult(await load())
    } finally {
      running = false
    }
  }

  return {
    start() {
      run()
      timer = setInterval(run, intervalMs)
      stopListening = onReturn(run)
    },
    stop() {
      clearInterval(timer)
      stopListening?.()
    },
  }
}
