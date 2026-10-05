import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { vi } from 'vitest'
import { routeTree } from '../routeTree.gen'
import { createAppStore } from '../store'
import { campaignLoaded } from '../store/campaign'
import { createSync } from '../campaign/sync'
import { createDemoSync } from '../campaign/demoSync'
import { validCampaign } from '../campaign/fixtures'
import { createDraftStorage } from '../campaign/draftStorage'
import { memoryStorage, respondWith } from './fakes'
import example from '../../public/exemplo-campanha.json'

const CAMPAIGN_URL = 'https://pub-123.r2.dev/campanha.json'

function demoSetup({ hunterId, introSeen = true, night = 1, status = 200 }) {
  const storage = memoryStorage({
    'ihunt.demo.active': '1',
    'ihunt.demo.night': String(night),
    ...(hunterId ? { 'ihunt.demo.hunterId': hunterId } : {}),
    ...(introSeen ? { 'ihunt.demo.introSeen': '1' } : {}),
  })
  return createDemoSync({ fetch: respondWith(status === 200 ? example : 'Not Found', status), storage, origin: 'https://ihunt.test' })
}

function realSetup({ body, status, hunterId, campaignUrl }) {
  const storage = memoryStorage({
    ...(campaignUrl ? { 'ihunt.campaignUrl': campaignUrl } : {}),
    ...(hunterId ? { 'ihunt.hunterId': hunterId } : {}),
  })
  return createSync({ fetch: respondWith(body, status), storage })
}

export async function renderApp({
  path = '/',
  body = validCampaign(),
  status = 200,
  hunterId = 'ana',
  campaignUrl = CAMPAIGN_URL,
  pendingInvite = null,
  demo = null,
  editorStorage = memoryStorage(),
} = {}) {
  const sync = demo ? demoSetup(demo) : realSetup({ body, status, hunterId, campaignUrl })
  const leaveDemo = vi.fn()
  const saveFile = vi.fn()
  const store = createAppStore({ sync, pendingInvite, leaveDemo, saveFile, drafts: createDraftStorage(editorStorage) })
  store.dispatch(campaignLoaded(await sync.load()))

  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { ...view, store, router, sync, leaveDemo, saveFile, editorStorage }
}
