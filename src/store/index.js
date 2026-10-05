import { configureStore } from '@reduxjs/toolkit'
import campaignReducer, { initialCampaignState } from './campaign'

function demoState(sync) {
  if (!sync.isDemo) return null
  return { night: sync.getNight(), lastNight: sync.lastNight, introSeen: sync.hasSeenIntro(), changes: null }
}

function goHome() {
  window.location.assign('/')
}

export function createAppStore({ sync, pendingInvite = null, leaveDemo = goHome }) {
  return configureStore({
    reducer: {
      campaign: campaignReducer,
    },
    preloadedState: {
      campaign: initialCampaignState({
        hunterId: sync.getHunterId(),
        pendingInvite,
        readMessageIds: sync.getReadMessageIds(),
        campaignUrl: sync.getCampaignUrl(),
        demo: demoState(sync),
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { sync, leaveDemo } } }),
  })
}
