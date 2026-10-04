import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { conversation } from '../campaign/campaign'

export const chooseHunter = createAsyncThunk(
  'campaign/chooseHunter',
  (hunterId, { extra }) => {
    extra.sync.setHunterId(hunterId)
    return hunterId
  },
)

export const forgetHunter = createAsyncThunk(
  'campaign/forgetHunter',
  (_, { extra }) => extra.sync.clearHunterId(),
)

export const markConversationRead = createAsyncThunk(
  'campaign/markConversationRead',
  (npcId, { extra, getState }) => {
    const { data, hunterId } = getState().campaign
    const ids = conversation(data, hunterId, npcId)?.messages.map(message => message.id) ?? []
    return extra.sync.markMessagesRead(ids)
  },
)

export const switchCampaign = createAsyncThunk(
  'campaign/switch',
  (url, { extra }) => {
    extra.sync.acceptInvite(url)
    return extra.sync.load()
  },
)

export function initialCampaignState({ hunterId = null, pendingInvite = null, readMessageIds = [] } = {}) {
  return {
    status: 'loading',
    data: null,
    errors: [],
    error: null,
    offline: false,
    updateError: null,
    hunterId,
    pendingInvite,
    readMessageIds,
  }
}

function applyLoadResult(state, result) {
  state.status = result.status
  state.data = result.campaign ?? null
  state.errors = result.errors ?? []
  state.error = result.error ?? null
  state.offline = result.offline ?? false
  state.updateError = result.updateError ?? null
}

const campaignSlice = createSlice({
  name: 'campaign',
  initialState: initialCampaignState(),
  reducers: {
    campaignLoaded(state, { payload }) {
      applyLoadResult(state, payload)
    },
    keepCurrentCampaign(state) {
      state.pendingInvite = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(chooseHunter.fulfilled, (state, { payload }) => {
        state.hunterId = payload
      })
      .addCase(forgetHunter.fulfilled, (state) => {
        state.hunterId = null
      })
      .addCase(markConversationRead.fulfilled, (state, { payload }) => {
        state.readMessageIds = payload
      })
      .addCase(switchCampaign.pending, (state) => {
        Object.assign(state, initialCampaignState())
      })
      .addCase(switchCampaign.fulfilled, (state, { payload }) => {
        applyLoadResult(state, payload)
      })
  },
})

export const { campaignLoaded, keepCurrentCampaign } = campaignSlice.actions
export default campaignSlice.reducer
