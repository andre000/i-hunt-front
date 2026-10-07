import { createAsyncThunk, createSlice, original } from '@reduxjs/toolkit'
import { addItem, addMessage, advanceToNextScheduled, moveItem, draftFile, draftFileName, draftFrom, localFileName, readDraftText, removeHunter, removeItem, removeNpc, setMissionPosition, updateCampaign, updateItem } from '../campaign/draft'

export const openPublishedDraft = createAsyncThunk(
  'editor/openPublished',
  async (url, { extra }) => {
    const result = await extra.sync.readPublished(url)
    return { ...result, target: extra.publisher.targetOf(result.url) }
  },
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

const campaignFile = (draft) => draftFile(draft, { schemaUrl: `${window.location.origin}/campaign.schema.json` })

export const downloadDraft = createAsyncThunk(
  'editor/download',
  (_, { extra, getState }) => {
    const { draft, fileName } = getState().editor
    extra.saveFile(fileName, campaignFile(draft))
  },
)

export const publishDraft = createAsyncThunk(
  'editor/publish',
  async (token, { extra, getState, rejectWithValue }) => {
    const { draft, target, publishName, opened } = getState().editor
    const name = target ?? publishName
    try {
      const { url } = await extra.publisher.publish(name, campaignFile(draft), token)
      return { sent: draft, name, url, opened }
    } catch (error) {
      return rejectWithValue({ status: error.status ?? null, opened })
    }
  },
)

function askPasswordOrPublish(dispatch, publisher) {
  const token = publisher.savedToken()
  dispatch(token ? publishDraft(token) : publishPasswordAsked())
}

export function startPublishing() {
  return (dispatch, getState, { publisher }) => {
    const { editor, campaign } = getState()
    if (editor.target) askPasswordOrPublish(dispatch, publisher)
    else dispatch(publishNameAsked(publisher.targetOf(campaign.campaignUrl)))
  }
}

export function choosePublishName(name) {
  return (dispatch, _, { publisher }) => {
    dispatch(publishNameChosen(name))
    askPasswordOrPublish(dispatch, publisher)
  }
}

export function initialEditorState(saved = null) {
  return {
    draft: saved?.draft ?? null,
    fileName: saved?.fileName ?? draftFileName(null),
    target: saved?.target ?? null,
    unsaved: saved?.unsaved ?? false,
    started: Boolean(saved),
    loading: false,
    error: null,
    carriedDate: null,
    carriedReady: false,
    publishing: null,
    publishFailure: null,
    publishName: null,
    publishLive: null,
    publishedUrl: null,
    opened: 0,
  }
}

function edit(state, change) {
  state.draft = change(state.draft)
  state.unsaved = true
  if (state.publishing === 'done' || state.publishing === 'failed') state.publishing = null
}

function open(state, draft, fileName, target = null) {
  state.opened += 1
  Object.assign(state, { draft, fileName, target, unsaved: false, started: true, loading: false, error: null, publishing: null, publishFailure: null, publishName: null, publishedUrl: null })
}

const editorSlice = createSlice({
  name: 'editor',
  initialState: initialEditorState(),
  reducers: {
    draftOpened(state, { payload }) {
      open(state, payload.draft, payload.fileName ?? draftFileName(null))
    },
    draftDiscarded(state) {
      Object.assign(state, initialEditorState(), { started: true, opened: state.opened + 1 })
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
    dateCarried(state, { payload }) {
      state.carriedDate = payload
      state.carriedReady = false
    },
    carriedDateApplied(state) {
      if (state.draft && state.carriedDate) edit(state, draft => updateCampaign(draft, { date: state.carriedDate }))
      state.carriedDate = null
      state.carriedReady = false
    },
    carriedDateDropped(state) {
      state.carriedDate = null
      state.carriedReady = false
    },
    publishPasswordAsked(state) {
      state.publishing = 'password'
      state.publishFailure = null
    },
    publishNameAsked(state, { payload }) {
      state.publishing = 'name'
      state.publishFailure = null
      state.publishLive = payload ?? null
    },
    publishNameChosen(state, { payload }) {
      state.publishName = payload
    },
    publishCancelled(state) {
      state.publishing = null
      state.publishFailure = null
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
        else open(state, draftFrom(payload.raw), draftFileName(payload.url), payload.target)
        if (payload.error) state.carriedDate = null
        state.carriedReady = Boolean(state.carriedDate)
      })
      .addCase(openPublishedDraft.rejected, (state) => {
        state.loading = false
        state.carriedDate = null
        state.carriedReady = false
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
      .addCase(publishDraft.pending, (state) => {
        state.publishing = 'sending'
        state.publishFailure = null
      })
      .addCase(publishDraft.fulfilled, (state, { payload }) => {
        if (payload.opened !== state.opened) return
        state.publishing = 'done'
        state.target = payload.name
        state.publishedUrl = payload.url
        if (original(state).draft === payload.sent) state.unsaved = false
      })
      .addCase(publishDraft.rejected, (state, { payload }) => {
        if (payload.opened !== state.opened) return
        state.publishing = payload.status === 401 ? 'password' : 'failed'
        state.publishFailure = payload.status
      })
  },
})

export const { campaignDateAdvanced, campaignEdited, carriedDateApplied, carriedDateDropped, dateCarried, draftDiscarded, draftOpened, hunterRemoved, itemAdded, itemMoved, itemRemoved, itemUpdated, messageAdded, missionPositioned, npcRemoved, publishCancelled, publishNameAsked, publishNameChosen, publishPasswordAsked } = editorSlice.actions
export default editorSlice.reducer
