import { describe, expect, it } from 'vitest'
import { chooseMode } from './demoEntry'
import { isDemoActive, startDemo } from './demoSync'
import { memoryStorage } from '../test/fakes'

describe('chooseMode', () => {
  it('starts the demo on /demo', () => {
    const session = memoryStorage()

    expect(chooseMode({ pathname: '/demo', search: '', session })).toBe('demo')
    expect(isDemoActive(session)).toBe(true)
  })

  it('stays in the demo after a reload on another path', () => {
    const session = memoryStorage()
    startDemo(session)

    expect(chooseMode({ pathname: '/', search: '', session })).toBe('demo')
  })

  it('uses the real app when the demo was never started', () => {
    expect(chooseMode({ pathname: '/', search: '', session: memoryStorage() })).toBe('real')
  })

  it('turns the demo off when the URL carries an invite', () => {
    const session = memoryStorage({ 'ihunt.demo.night': '2' })
    startDemo(session)
    const search = '?campanha=https%3A%2F%2Fpub-123.r2.dev%2Fc.json'

    expect(chooseMode({ pathname: '/', search, session })).toBe('real')
    expect(session.keys()).toEqual([])
  })
})
