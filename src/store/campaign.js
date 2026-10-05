import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { conversation } from '../campaign/messages'
import { nightChanges } from '../campaign/nightChanges'

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

export const advanceNight = createAsyncThunk(
  'campaign/advanceNight',
  async (_, { extra, getState }) => {
    const { data: before, hunterId } = getState().campaign
    const night = extra.sync.advanceNight()
    const result = await extra.sync.load()
    const changes = before && result.campaign ? nightChanges(before, result.campaign, hunterId) : null
    return { night, result, changes }
  },
)

export const restartDemo = createAsyncThunk(
  'campaign/restartDemo',
  (_, { extra }) => {
    extra.sync.restart()
    return extra.sync.load()
  },
)

export const exitDemo = createAsyncThunk(
  'campaign/exitDemo',
  (_, { extra }) => {
    extra.sync.exit()
    extra.leaveDemo()
  },
)

export const dismissDemoIntro = createAsyncThunk(
  'campaign/dismissDemoIntro',
  (_, { extra }) => extra.sync.markIntroSeen(),
)

export const reloadCampaign = createAsyncThunk(
  'campaign/reload',
  (_, { extra }) => extra.sync.load(),
)

export function initialCampaignState({ hunterId = null, pendingInvite = null, readMessageIds = [], campaignUrl = null, demo = null } = {}) {
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
    campaignUrl,
    demo,
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
    clearDemoChanges(state) {
      if (state.demo) state.demo.changes = null
    },
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
      .addCase(switchCampaign.pending, (state, { meta }) => {
        Object.assign(state, initialCampaignState({ campaignUrl: meta.arg }))
      })
      .addCase(switchCampaign.fulfilled, (state, { payload }) => {
        applyLoadResult(state, payload)
      })
      .addCase(advanceNight.fulfilled, (state, { payload }) => {
        applyLoadResult(state, payload.result)
        state.demo.night = payload.night
        state.demo.changes = payload.changes
      })
      .addCase(restartDemo.fulfilled, (state, { payload }) => {
        applyLoadResult(state, payload)
        state.demo.night = 1
        state.demo.changes = null
        state.hunterId = null
        state.readMessageIds = []
      })
      .addCase(dismissDemoIntro.fulfilled, (state) => {
        state.demo.introSeen = true
      })
      .addCase(reloadCampaign.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(reloadCampaign.fulfilled, (state, { payload }) => {
        applyLoadResult(state, payload)
      })
  },
})

export const { campaignLoaded, keepCurrentCampaign, clearDemoChanges } = campaignSlice.actions
export default campaignSlice.reducer
