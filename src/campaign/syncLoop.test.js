import { describe, expect, it, vi } from 'vitest'
import { createSyncLoop } from './syncLoop'

function fakeEnvironment() {
  const timers = []
  const returnHandlers = []
  return {
    timers,
    returnHandlers,
    setInterval: vi.fn((run, ms) => timers.push({ run, ms }) - 1),
    clearInterval: vi.fn((id) => { timers[id] = null }),
    onReturn: vi.fn((run) => {
      returnHandlers.push(run)
      return () => returnHandlers.splice(returnHandlers.indexOf(run), 1)
    }),
  }
}

function deferred() {
  let resolve
  const promise = new Promise(r => { resolve = r })
  return { promise, resolve }
}

describe('createSyncLoop triggers', () => {
  it('loads right away and hands over the result', async () => {
    const env = fakeEnvironment()
    const onResult = vi.fn()
    const load = vi.fn(async () => ({ status: 'ready' }))

    createSyncLoop({ load, onResult, ...env }).start()
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith({ status: 'ready' }))

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('loads again every 30 seconds', async () => {
    const env = fakeEnvironment()
    const load = vi.fn(async () => ({}))
    createSyncLoop({ load, onResult: () => {}, ...env }).start()
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))

    expect(env.timers[0].ms).toBe(30000)
    env.timers[0].run()

    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })

  it('loads again when the player comes back to the app', async () => {
    const env = fakeEnvironment()
    const load = vi.fn(async () => ({}))
    createSyncLoop({ load, onResult: () => {}, ...env }).start()
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))

    env.returnHandlers[0]()

    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })
})

describe('createSyncLoop guards', () => {
  it('does not start a second load while one is running', async () => {
    const env = fakeEnvironment()
    const pending = deferred()
    const load = vi.fn(() => pending.promise)
    const onResult = vi.fn()
    createSyncLoop({ load, onResult, ...env }).start()

    env.timers[0].run()
    env.returnHandlers[0]()
    pending.resolve({})
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('stops the timer and the return listener', async () => {
    const env = fakeEnvironment()
    const loop = createSyncLoop({ load: async () => ({}), onResult: () => {}, ...env })
    loop.start()

    loop.stop()

    expect(env.clearInterval).toHaveBeenCalledWith(0)
    expect(env.returnHandlers).toEqual([])
  })
})
