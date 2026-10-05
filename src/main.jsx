import "./assets/style/reset.css"
import "./assets/style/main.css"
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { createAppStore } from './store'
import { campaignLoaded } from './store/campaign'
import { createSync } from './campaign/sync'
import { createDraftStorage } from './campaign/draftStorage'
import { createSyncLoop } from './campaign/syncLoop'
import { readInvite } from './campaign/invite'
import { createDemoSync } from './campaign/demoSync'
import { chooseMode } from './campaign/demoEntry'
import { Provider } from 'react-redux'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function browserSession() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const fetchCampaignFile = window.fetch.bind(window)
const mode = chooseMode({ pathname: window.location.pathname, search: window.location.search, session: browserSession() })
const sync = mode === 'demo'
  ? createDemoSync({ fetch: fetchCampaignFile, storage: browserSession(), origin: window.location.origin })
  : createSync({ fetch: fetchCampaignFile, storage: browserStorage() })
if (mode === 'demo' && window.location.pathname.startsWith('/demo')) window.history.replaceState(null, '', '/')

const invite = mode === 'demo' ? null : readInvite(window.location.search)
const pendingInvite = invite && sync.offerInvite(invite) === 'needs-confirmation' ? invite : null
if (invite) window.history.replaceState(null, '', window.location.pathname)

const store = createAppStore({ sync, pendingInvite, drafts: createDraftStorage(browserStorage()) })

function onReturn(run) {
  const onVisible = () => {
    if (document.visibilityState === 'visible') run()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('online', run)
  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('online', run)
  }
}

createSyncLoop({
  load: () => sync.load(),
  onResult: (result) => store.dispatch(campaignLoaded(result)),
  setInterval: (run, ms) => window.setInterval(run, ms),
  clearInterval: (id) => window.clearInterval(id),
  onReturn,
}).start()

// Create a new router instance
const router = createRouter({ routeTree })

// Render the app
const rootElement = document.getElementById('root')

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </StrictMode>,
  )
}
