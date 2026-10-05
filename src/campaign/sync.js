import { parseCampaign } from './parseCampaign'
import { fetchCampaign } from './fetchCampaign'
import { attempt, safeStorage } from './storage'

const CAMPAIGN_URL_KEY = 'ihunt.campaignUrl'
const HUNTER_ID_KEY = 'ihunt.hunterId'
const LAST_CAMPAIGN_KEY = 'ihunt.lastCampaign'
const READ_MESSAGES_KEY = 'ihunt.readMessages'

function readJson(store, key) {
  return attempt(() => JSON.parse(store.get(key)))
}

function lastValidCampaign(store, url) {
  const saved = readJson(store, LAST_CAMPAIGN_KEY)
  if (saved?.url !== url) return null
  const result = parseCampaign(saved.raw)
  return result.ok ? result.campaign : null
}

function failureWithoutFallback(fetched) {
  return fetched.failure === 'invalid'
    ? { status: 'invalid', errors: fetched.errors }
    : { status: 'error', error: fetched.error }
}

async function loadCampaign(fetch, store, url) {
  const fetched = await fetchCampaign(fetch, url)

  if (!fetched.failure) {
    store.set(LAST_CAMPAIGN_KEY, JSON.stringify({ url, raw: fetched.raw }))
    return { status: 'ready', campaign: fetched.campaign, offline: false, updateError: null, errors: [] }
  }

  const last = lastValidCampaign(store, url)
  if (!last) return failureWithoutFallback(fetched)

  return {
    status: 'ready',
    campaign: last,
    offline: fetched.failure === 'offline',
    updateError: fetched.failure === 'http' ? fetched.error : null,
    errors: fetched.errors ?? [],
  }
}

export function createSync({ fetch, storage }) {
  const store = safeStorage(storage)

  function acceptInvite(url) {
    if (store.get(CAMPAIGN_URL_KEY) === url) return
    store.set(CAMPAIGN_URL_KEY, url)
    for (const key of [HUNTER_ID_KEY, LAST_CAMPAIGN_KEY, READ_MESSAGES_KEY]) store.remove(key)
  }

  function getReadMessageIds() {
    const saved = readJson(store, READ_MESSAGES_KEY)
    return Array.isArray(saved) ? saved : []
  }

  return {
    acceptInvite,
    offerInvite(url) {
      const current = store.get(CAMPAIGN_URL_KEY)
      if (current && current !== url) return 'needs-confirmation'
      acceptInvite(url)
      return 'accepted'
    },
    getReadMessageIds,
    markMessagesRead(ids) {
      const updated = [...new Set([...getReadMessageIds(), ...ids])]
      store.set(READ_MESSAGES_KEY, JSON.stringify(updated))
      return updated
    },
    getCampaignUrl: () => store.get(CAMPAIGN_URL_KEY),
    getHunterId: () => store.get(HUNTER_ID_KEY),
    setHunterId: (hunterId) => store.set(HUNTER_ID_KEY, hunterId),
    clearHunterId: () => store.remove(HUNTER_ID_KEY),
    async readPublished(url = store.get(CAMPAIGN_URL_KEY)) {
      const fetched = await fetchCampaign(fetch, url)
      if (fetched.raw !== undefined) return { raw: fetched.raw, url }
      return { error: fetched.error ?? fetched.errors[0].message }
    },
    load() {
      const url = store.get(CAMPAIGN_URL_KEY)
      return url ? loadCampaign(fetch, store, url) : Promise.resolve({ status: 'no-campaign' })
    },
  }
}
