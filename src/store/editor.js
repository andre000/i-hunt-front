import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { draftFrom, updateCampaign } from '../campaign/draft'

export const openPublishedDraft = createAsyncThunk(
  'editor/openPublished',
  (_, { extra }) => extra.sync.readPublished(),
)

const editorSlice = createSlice({
  name: 'editor',
  initialState: { status: 'empty', draft: null, error: null },
  reducers: {
    campaignEdited(state, { payload }) {
      state.draft = updateCampaign(state.draft, payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(openPublishedDraft.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(openPublishedDraft.fulfilled, (state, { payload }) => {
        if (payload.error) {
          state.status = 'error'
          state.error = payload.error
          return
        }
        state.status = 'ready'
        state.draft = draftFrom(payload.raw)
        state.error = null
      })
  },
})

export const { campaignEdited } = editorSlice.actions
export default editorSlice.reducer
