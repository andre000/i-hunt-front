import { configureStore } from '@reduxjs/toolkit'
import campaignReducer, { initialCampaignState } from './campaign'
import userReducer from './user'

export function createAppStore({ sync }) {
  return configureStore({
    reducer: {
      campaign: campaignReducer,
      user: userReducer,
    },
    preloadedState: {
      campaign: initialCampaignState(sync.getHunterId()),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { sync } } }),
  })
}
