import "./assets/style/reset.css"
import "./assets/style/main.css"
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { createAppStore } from './store'
import { loadCampaign } from './store/campaign'
import { createSync, readInvite } from './campaign/sync'
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

const sync = createSync({ fetch: window.fetch.bind(window), storage: browserStorage() })
const invite = readInvite(window.location.search)
if (invite) {
  sync.acceptInvite(invite)
  window.history.replaceState(null, '', window.location.pathname)
}
const store = createAppStore({ sync })
store.dispatch(loadCampaign())

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
