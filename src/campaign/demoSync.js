import { fetchCampaign } from './fetchCampaign'
import { parseCampaign } from './parseCampaign'
import { attempt, safeStorage } from './storage'

export const NIGHT_OFFSETS_HOURS = [0, 24, 60]
export const LAST_NIGHT = NIGHT_OFFSETS_HOURS.length
export const DEMO_CAMPAIGN_PATH = '/exemplo-campanha.json'

const KEYS = {
  active: 'ihunt.demo.active',
  night: 'ihunt.demo.night',
  hunterId: 'ihunt.demo.hunterId',
  readMessages: 'ihunt.demo.readMessages',
  lastCampaign: 'ihunt.demo.lastCampaign',
  introSeen: 'ihunt.demo.introSeen',
}

const HOUR = 60 * 60 * 1000

function offsetMinutes(offset) {
  if (offset === 'Z') return 0
  const sign = offset.startsWith('-') ? -1 : 1
  return sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)))
}

export function shiftDate(iso, hours) {
  const offset = iso.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1] ?? 'Z'
  const local = new Date(new Date(iso).getTime() + hours * HOUR + offsetMinutes(offset) * 60 * 1000)
  return `${local.toISOString().slice(0, 19)}${offset}`
}

export function startDemo(storage) {
  safeStorage(storage).set(KEYS.active, '1')
}

export function isDemoActive(storage) {
  return safeStorage(storage).get(KEYS.active) === '1'
}

export function clearDemo(storage) {
  const store = safeStorage(storage)
  Object.values(KEYS).forEach(key => store.remove(key))
}

function atNight(campaign, night) {
  const date = shiftDate(campaign.campaign.date, NIGHT_OFFSETS_HOURS[night - 1])
  return { ...campaign, campaign: { ...campaign.campaign, date } }
}

function failure(fetched) {
  return fetched.failure === 'invalid'
    ? { status: 'invalid', errors: fetched.errors }
    : { status: 'error', error: fetched.error }
}

function savedCampaign(store) {
  const result = attempt(() => parseCampaign(JSON.parse(store.get(KEYS.lastCampaign))))
  return result?.ok ? result.campaign : null
}

async function exampleCampaign(fetch, store, url) {
  const fetched = await fetchCampaign(fetch, url)
  if (!fetched.failure) {
    store.set(KEYS.lastCampaign, JSON.stringify(fetched.raw))
    return { campaign: fetched.campaign, offline: false }
  }
  const saved = savedCampaign(store)
  return saved ? { campaign: saved, offline: true } : { failure: failure(fetched) }
}

export function createDemoSync({ fetch, storage, origin }) {
  const store = safeStorage(storage)
  const url = `${origin}${DEMO_CAMPAIGN_PATH}`

  function getNight() {
    const night = Math.trunc(Number(store.get(KEYS.night)))
    if (!Number.isFinite(night) || night < 1) return 1
    return Math.min(night, LAST_NIGHT)
  }

  function getReadMessageIds() {
    const saved = attempt(() => JSON.parse(store.get(KEYS.readMessages)))
    return Array.isArray(saved) ? saved : []
  }

  return {
    isDemo: true,
    lastNight: LAST_NIGHT,
    getNight,
    advanceNight() {
      const next = Math.min(getNight() + 1, LAST_NIGHT)
      store.set(KEYS.night, String(next))
      return next
    },
    restart() {
      store.set(KEYS.night, '1')
      store.remove(KEYS.hunterId)
      store.remove(KEYS.readMessages)
    },
    exit: () => clearDemo(storage),
    hasSeenIntro: () => store.get(KEYS.introSeen) === '1',
    markIntroSeen: () => store.set(KEYS.introSeen, '1'),
    getCampaignUrl: () => url,
    offerInvite: () => 'accepted',
    acceptInvite() {},
    getHunterId: () => store.get(KEYS.hunterId),
    setHunterId: (hunterId) => store.set(KEYS.hunterId, hunterId),
    clearHunterId: () => store.remove(KEYS.hunterId),
    getReadMessageIds,
    markMessagesRead(ids) {
      const updated = [...new Set([...getReadMessageIds(), ...ids])]
      store.set(KEYS.readMessages, JSON.stringify(updated))
      return updated
    },
    async load() {
      const loaded = await exampleCampaign(fetch, store, url)
      if (loaded.failure) return loaded.failure
      return { status: 'ready', campaign: atNight(loaded.campaign, getNight()), offline: loaded.offline, updateError: null, errors: [] }
    },
  }
}
