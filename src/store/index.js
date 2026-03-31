import { configureStore } from '@reduxjs/toolkit'
import missionsReducer from './missions'
import userReducer from './user'

export const store = configureStore({
  reducer: {
    missions: missionsReducer,
    user: userReducer,
  },
})