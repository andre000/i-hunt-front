import { configureStore } from '@reduxjs/toolkit'
import campaignReducer, { initialCampaignState } from './campaign'
import userReducer from './user'

export function createAppStore({ sync, pendingInvite = null }) {
  return configureStore({
    reducer: {
      campaign: campaignReducer,
      user: userReducer,
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
