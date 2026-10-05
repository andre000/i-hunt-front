import { configureStore } from '@reduxjs/toolkit'
import campaignReducer, { initialCampaignState } from './campaign'
import editorReducer, { initialEditorState } from './editor'
import { createDraftStorage } from '../campaign/draftStorage'

function demoState(sync) {
  if (!sync.isDemo) return null
  return { night: sync.getNight(), lastNight: sync.lastNight, introSeen: sync.hasSeenIntro(), changes: null }
}

function goHome() {
  window.location.assign('/')
}

function saveToComputer(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function createAppStore({ sync, pendingInvite = null, leaveDemo = goHome, saveFile = saveToComputer, drafts = createDraftStorage(null) }) {
  const store = configureStore({
    reducer: {
      campaign: campaignReducer,
      editor: editorReducer,
    },
    preloadedState: {
      campaign: initialCampaignState({
        hunterId: sync.getHunterId(),
        pendingInvite,
        readMessageIds: sync.getReadMessageIds(),
        campaignUrl: sync.getCampaignUrl(),
        demo: demoState(sync),
      }),
      editor: initialEditorState(drafts.load()),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { sync, leaveDemo, saveFile } } }),
  })

  let saved = store.getState().editor
  store.subscribe(() => {
    const { editor } = store.getState()
    if (editor === saved) return
    saved = editor
    drafts.save(editor)
  })
  return store
}
