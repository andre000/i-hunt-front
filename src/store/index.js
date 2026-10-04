import { configureStore } from '@reduxjs/toolkit'
import campaignReducer, { initialCampaignState } from './campaign'

export function createAppStore({ sync, pendingInvite = null }) {
  return configureStore({
    reducer: {
      campaign: campaignReducer,
    },
    preloadedState: {
      campaign: initialCampaignState({
        hunterId: sync.getHunterId(),
        pendingInvite,
        readMessageIds: sync.getReadMessageIds(),
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { sync } } }),
  })
}
