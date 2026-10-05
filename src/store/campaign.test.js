import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { createAppStore } from './index'
import { advanceNight, campaignLoaded, chooseHunter, dismissDemoIntro, exitDemo, restartDemo } from './campaign'
import { createDemoSync } from '../campaign/demoSync'
import { memoryStorage, respondWith } from '../test/fakes'

const example = JSON.parse(readFileSync(new URL('../../public/exemplo-campanha.json', import.meta.url), 'utf8'))

async function demoStore() {
  const storage = memoryStorage()
  const sync = createDemoSync({ fetch: respondWith(example), storage, origin: 'https://ihunt.test' })
  const leaveDemo = vi.fn()
  const store = createAppStore({ sync, leaveDemo })
  store.dispatch(campaignLoaded(await sync.load()))
  return { store, storage, leaveDemo }
}

describe('demo state', () => {
  it('starts on the first night with the intro not seen', async () => {
    const { store } = await demoStore()

    expect(store.getState().campaign.demo).toEqual({ night: 1, lastNight: 3, introSeen: false, changes: null })
  })

  it('advances the night, moves the campaign date and records what changed', async () => {
    const { store } = await demoStore()
    await store.dispatch(chooseHunter('ana'))

    await store.dispatch(advanceNight())

    const { demo, data } = store.getState().campaign
    expect(demo.night).toBe(2)
    expect(demo.changes).toEqual({ newMissionIds: ['culto-guaiba'], messages: 1, expired: 0 })
    expect(data.campaign.date).toBe('2026-10-11T22:00:00-03:00')
  })

  it('restarts at the first night without a hunter', async () => {
    const { store } = await demoStore()
    await store.dispatch(chooseHunter('ana'))
    await store.dispatch(advanceNight())

    await store.dispatch(restartDemo())

    const { demo, hunterId, readMessageIds } = store.getState().campaign
    expect(demo.night).toBe(1)
    expect(demo.changes).toBeNull()
    expect(hunterId).toBeNull()
    expect(readMessageIds).toEqual([])
  })

  it('remembers the intro was dismissed', async () => {
    const { store, storage } = await demoStore()

    await store.dispatch(dismissDemoIntro())

    expect(store.getState().campaign.demo.introSeen).toBe(true)
    expect(storage.getItem('ihunt.demo.introSeen')).toBe('1')
  })

  it('clears the demo keys and leaves on exit', async () => {
    const { store, storage, leaveDemo } = await demoStore()
    await store.dispatch(chooseHunter('ana'))

    await store.dispatch(exitDemo())

    expect(storage.keys()).toEqual([])
    expect(leaveDemo).toHaveBeenCalledOnce()
  })
})
