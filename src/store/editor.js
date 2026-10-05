import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { draftFile, draftFileName, draftFrom, updateCampaign } from '../campaign/draft'

export const openPublishedDraft = createAsyncThunk(
  'editor/openPublished',
  (_, { extra }) => extra.sync.readPublished(),
)

export const downloadDraft = createAsyncThunk(
  'editor/download',
  (_, { extra, getState }) => {
    const { draft, fileName } = getState().editor
    extra.saveFile(fileName, draftFile(draft, { schemaUrl: `${window.location.origin}/campaign.schema.json` }))
  },
)

const editorSlice = createSlice({
  name: 'editor',
  initialState: { status: 'empty', draft: null, fileName: null, error: null },
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
        state.fileName = draftFileName(payload.url)
        state.error = null
      })
  },
})

export const { campaignEdited } = editorSlice.actions
export default editorSlice.reducer
