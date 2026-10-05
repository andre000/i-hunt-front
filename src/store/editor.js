import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { addItem, addMessage, advanceToNextScheduled, moveItem, draftFile, draftFileName, draftFrom, localFileName, readDraftText, removeHunter, removeItem, removeNpc, setMissionPosition, updateCampaign, updateItem } from '../campaign/draft'

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
  async (file) => ({ ...readDraftText(await readText(file)), fileName: localFileName(file.name) }),
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

function edit(state, change) {
  state.draft = change(state.draft)
  state.unsaved = true
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
      edit(state, draft => advanceToNextScheduled(draft))
    },
    itemAdded(state, { payload }) {
      edit(state, draft => addItem(draft, payload.section, payload.fields))
    },
    itemUpdated(state, { payload }) {
      edit(state, draft => updateItem(draft, payload.section, payload.index, payload.changes))
    },
    missionPositioned(state, { payload }) {
      edit(state, draft => setMissionPosition(draft, payload.index, payload.position))
    },
    messageAdded(state, { payload }) {
      edit(state, draft => addMessage(draft, payload))
    },
    itemMoved(state, { payload }) {
      edit(state, draft => moveItem(draft, payload.section, payload.from, payload.to))
    },
    itemRemoved(state, { payload }) {
      edit(state, draft => removeItem(draft, payload.section, payload.index))
    },
    hunterRemoved(state, { payload }) {
      edit(state, draft => removeHunter(draft, payload))
    },
    npcRemoved(state, { payload }) {
      const result = removeNpc(state.draft, payload)
      if (!result.ok) return
      edit(state, () => result.draft)
    },
    campaignEdited(state, { payload }) {
      edit(state, draft => updateCampaign(draft, payload))
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
      .addCase(openPublishedDraft.rejected, (state) => {
        state.loading = false
        state.error = 'Não foi possível carregar a campanha.'
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

export const { campaignDateAdvanced, campaignEdited, draftDiscarded, draftOpened, hunterRemoved, itemAdded, itemMoved, itemRemoved, itemUpdated, messageAdded, missionPositioned, npcRemoved } = editorSlice.actions
export default editorSlice.reducer
