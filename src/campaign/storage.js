export function attempt(action) {
  try {
    return action()
  } catch {
    return null
  }
}

export function safeStorage(storage) {
  const memory = new Map()
  return {
    get(key) {
      return attempt(() => storage.getItem(key)) ?? memory.get(key) ?? null
    },
    set(key, value) {
      memory.set(key, value)
      attempt(() => storage.setItem(key, value))
    },
    remove(key) {
      memory.delete(key)
      attempt(() => storage.removeItem(key))
    },
  }
}
