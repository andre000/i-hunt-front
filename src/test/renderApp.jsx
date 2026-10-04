import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { createAppStore } from '../store'
import { campaignLoaded } from '../store/campaign'
import { createSync } from '../campaign/sync'
import { validCampaign } from '../campaign/fixtures'

const CAMPAIGN_URL = 'https://pub-123.r2.dev/campanha.json'

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  }
}

function respondWith(body, status = 200) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  })
}

export async function renderApp({
  path = '/',
  body = validCampaign(),
  status = 200,
  hunterId = 'ana',
  campaignUrl = CAMPAIGN_URL,
  pendingInvite = null,
} = {}) {
  const storage = memoryStorage({
    ...(campaignUrl ? { 'ihunt.campaignUrl': campaignUrl } : {}),
    ...(hunterId ? { 'ihunt.hunterId': hunterId } : {}),
  })
  const sync = createSync({ fetch: respondWith(body, status), storage })
  const store = createAppStore({ sync, pendingInvite })
  store.dispatch(campaignLoaded(await sync.load()))

  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { ...view, store, router, sync }
}
