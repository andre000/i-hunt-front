import { safeStorage } from './storage'

const TOKEN_KEY = 'ihunt.editor.publishToken'
const CAMPAIGN_NAME = /^[a-z0-9-]+\.json$/

export function createPublisher({ fetch, storage, publicBaseUrl }) {
  const store = safeStorage(storage)
  return {
    targetOf(url) {
      if (!publicBaseUrl || !url?.startsWith(`${publicBaseUrl}/`)) return null
      const name = url.slice(publicBaseUrl.length + 1)
      return CAMPAIGN_NAME.test(name) ? name : null
    },
    savedToken: () => store.get(TOKEN_KEY),
    async publish(name, text, token) {
      const response = await fetch(`/api/campanhas/${name}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: text,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      store.set(TOKEN_KEY, token)
    },
  }
}
