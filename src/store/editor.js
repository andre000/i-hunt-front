import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { addItem, advanceToNextScheduled, draftFile, draftFileName, draftFrom, readDraftText, removeHunter, updateCampaign, updateItem } from '../campaign/draft'

export const openPublishedDraft = createAsyncThunk(
  'editor/openPublished',
  (url, { extra }) => extra.sync.readPublished(url),
)

function readText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export const openDraftFile = createAsyncThunk(
  'editor/openFile',
  async (file) => ({ ...readDraftText(await readText(file)), fileName: file.name }),
)

export const downloadDraft = createAsyncThunk(
  'editor/download',
  (_, { extra, getState }) => {
    const { draft, fileName } = getState().editor
    extra.saveFile(fileName, draftFile(draft, { schemaUrl: `${window.location.origin}/campaign.schema.json` }))
  },
)

export function initialEditorState(saved = null) {
  return {
    draft: saved?.draft ?? null,
    fileName: saved?.fileName ?? draftFileName(null),
    unsaved: saved?.unsaved ?? false,
    started: Boolean(saved),
    loading: false,
    error: null,
  }
}

function open(state, draft, fileName) {
  Object.assign(state, { draft, fileName, unsaved: false, started: true, loading: false, error: null })
}

const editorSlice = createSlice({
  name: 'editor',
  initialState: initialEditorState(),
  reducers: {
    draftOpened(state, { payload }) {
      open(state, payload.draft, payload.fileName ?? draftFileName(null))
    },
    draftDiscarded(state) {
      Object.assign(state, initialEditorState(), { started: true })
    },
    campaignDateAdvanced(state) {
      state.draft = advanceToNextScheduled(state.draft)
      state.unsaved = true
    },
    itemAdded(state, { payload }) {
      state.draft = addItem(state.draft, payload.section, payload.fields)
      state.unsaved = true
    },
    itemUpdated(state, { payload }) {
      state.draft = updateItem(state.draft, payload.section, payload.index, payload.changes)
      state.unsaved = true
    },
    hunterRemoved(state, { payload }) {
      state.draft = removeHunter(state.draft, payload)
      state.unsaved = true
    },
    campaignEdited(state, { payload }) {
      state.draft = updateCampaign(state.draft, payload)
      state.unsaved = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(openPublishedDraft.pending, (state) => {
        state.started = true
        state.loading = true
        state.error = null
      })
      .addCase(openPublishedDraft.fulfilled, (state, { payload }) => {
        state.loading = false
        if (payload.error) state.error = payload.error
        else open(state, draftFrom(payload.raw), draftFileName(payload.url))
      })
      .addCase(openDraftFile.fulfilled, (state, { payload }) => {
        state.started = true
        if (payload.error) state.error = payload.error
        else open(state, payload.draft, payload.fileName)
      })
      .addCase(openDraftFile.rejected, (state) => {
        state.started = true
        state.error = 'Não foi possível ler o arquivo.'
      })
      .addCase(downloadDraft.fulfilled, (state) => {
        state.unsaved = false
      })
  },
})

export const { campaignDateAdvanced, campaignEdited, draftDiscarded, draftOpened, hunterRemoved, itemAdded, itemUpdated } = editorSlice.actions
export default editorSlice.reducer
