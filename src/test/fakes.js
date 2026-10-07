export function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    keys: () => [...items.keys()],
  }
}

export function respondWith(body, status = 200) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  })
}

export function memoryBucket(initial = {}) {
  const objects = new Map(Object.entries(initial).map(([key, body]) => [key, { body, contentType: null }]))
  return {
    async put(key, body, options = {}) {
      objects.set(key, { body: await new Response(body).text(), contentType: options.httpMetadata?.contentType ?? null })
    },
    async get(key) {
      const object = objects.get(key)
      if (!object) return null
      return { text: async () => object.body, httpMetadata: { contentType: object.contentType } }
    },
    async list({ prefix = '' } = {}) {
      const keys = [...objects.keys()].filter((key) => key.startsWith(prefix))
      return { objects: keys.map((key) => ({ key })), truncated: false }
    },
    async delete(keys) {
      for (const key of [keys].flat()) objects.delete(key)
    },
    keys: () => [...objects.keys()],
  }
}
