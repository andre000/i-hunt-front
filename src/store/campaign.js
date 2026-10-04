import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const loadCampaign = createAsyncThunk(
  'campaign/load',
  (_, { extra }) => extra.sync.load(),
)

export const chooseHunter = createAsyncThunk(
  'campaign/chooseHunter',
  (hunterId, { extra }) => {
    extra.sync.setHunterId(hunterId)
    return hunterId
  },
)

export function initialCampaignState(hunterId = null) {
  return { status: 'loading', data: null, errors: [], error: null, hunterId }
}

const campaignSlice = createSlice({
  name: 'campaign',
  initialState: initialCampaignState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCampaign.fulfilled, (state, { payload }) => {
        state.status = payload.status
        state.data = payload.campaign ?? null
        state.errors = payload.errors ?? []
        state.error = payload.error ?? null
      })
      .addCase(chooseHunter.fulfilled, (state, { payload }) => {
        state.hunterId = payload
      })
  },
})

export default campaignSlice.reducer
