import { configureStore } from '@reduxjs/toolkit'
import missionsReducer from './missions'

export const store = configureStore({
  reducer: {
    missions: missionsReducer,
  },
})