import { attempt, safeStorage } from './storage'

const DRAFT_KEY = 'ihunt.editor.draft'

export function createDraftStorage(storage) {
  const store = safeStorage(storage)
  return {
    load() {
      const saved = attempt(() => JSON.parse(store.get(DRAFT_KEY)))
      return saved?.draft ? saved : null
    },
    save({ draft, fileName, unsaved }) {
      if (draft) store.set(DRAFT_KEY, JSON.stringify({ draft, fileName, unsaved }))
      else store.remove(DRAFT_KEY)
    },
  }
}
