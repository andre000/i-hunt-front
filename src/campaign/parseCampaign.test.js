import { describe, expect, it } from 'vitest'
import { parseCampaign } from './parseCampaign'
import { parsed, validCampaign } from './fixtures'

describe('parseCampaign with a valid campaign', () => {
  it('accepts a valid campaign', () => {
    const result = parseCampaign(validCampaign())

    expect(result.ok).toBe(true)
    expect(result.campaign.campaign.name).toBe('Noite em Porto Alegre')
    expect(result.campaign.hunters.map(h => h.id)).toEqual(['ana', 'beto'])
  })

  it('fills optional mission fields with defaults', () => {
    const vampire = parsed().missions.find(m => m.id === 'm3')

    expect(vampire).toMatchObject({ description: '', tags: [], featured: false, nearHunters: [] })
  })

  it('does not change the raw input', () => {
    const raw = validCampaign()
    parseCampaign(raw)

    expect(raw.missions[2]).not.toHaveProperty('tags')
  })
})

describe('parseCampaign with an invalid campaign', () => {
  it('reports a missing top-level field', () => {
    const raw = validCampaign()
    delete raw.hunters

    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/hunters' }))
  })

  it('reports a wrong field type with its path', () => {
    const raw = validCampaign()
    raw.missions[1].value = 'cem'

    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/missions/1/value' }))
  })

  it('reports a risk outside the allowed values', () => {
    const raw = validCampaign()
    raw.missions[0].risk = 'extremo'

    const result = parseCampaign(raw)

    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/missions/0/risk' }))
  })

  it('reports an invalid campaign date', () => {
    const raw = validCampaign()
    raw.campaign.date = 'amanhã'

    const result = parseCampaign(raw)

    expect(result.errors).toContainEqual(expect.objectContaining({ path: '/campaign/date' }))
  })

  it('reports a mission near a hunter that does not exist', () => {
    const raw = validCampaign()
    raw.missions[1].nearHunters = ['ana', 'carla']

    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      { path: '/missions/1/nearHunters/1', message: 'hunter "carla" não existe em /hunters' },
    ])
  })

  it.each([null, 'texto', 42, []])('rejects %j as a campaign', (raw) => {
    const result = parseCampaign(raw)

    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('mission fields in the schema', () => {
  it('accepts hunters, result, deadline and postedAt', () => {
    const result = parseCampaign({
      ...validCampaign(),
      missions: [{
        id: 'm1', name: 'Caça', location: 'Centro', value: 10, risk: 'baixo',
        hunters: ['ana'], result: 'concluída',
        deadline: '2026-10-06T12:00:00-03:00', postedAt: '2026-10-01T09:00:00-03:00',
      }],
    })

    expect(result.ok).toBe(true)
  })

  it('reports a result outside the allowed values', () => {
    const raw = validCampaign()
    raw.missions[0].result = 'abandonada'

    expect(parseCampaign(raw).errors).toContainEqual(expect.objectContaining({ path: '/missions/0/result' }))
  })

  it('reports an invalid deadline', () => {
    const raw = validCampaign()
    raw.missions[0].deadline = 'sexta'

    expect(parseCampaign(raw).errors).toContainEqual(expect.objectContaining({ path: '/missions/0/deadline' }))
  })

  it('reports a hunter on a mission that does not exist', () => {
    const raw = validCampaign()
    raw.missions[0].hunters = ['carla']

    expect(parseCampaign(raw).errors).toEqual([
      { path: '/missions/0/hunters/0', message: 'hunter "carla" não existe em /hunters' },
    ])
  })
})

describe('messages in the schema', () => {
  it('accepts a campaign without NPCs or messages', () => {
    const raw = validCampaign()
    delete raw.npcs
    delete raw.messages

    expect(parsed(raw)).toMatchObject({ npcs: [], messages: [] })
  })

  it('reports a message from an NPC that does not exist', () => {
    const raw = validCampaign()
    raw.messages[0].npc = 'ninguem'

    expect(parseCampaign(raw).errors).toEqual([
      { path: '/messages/0/npc', message: 'NPC "ninguem" não existe em /npcs' },
    ])
  })

  it('reports a message to a hunter that does not exist', () => {
    const raw = validCampaign()
    raw.messages[1].to = ['ana', 'carla']

    expect(parseCampaign(raw).errors).toEqual([
      { path: '/messages/1/to/1', message: 'hunter "carla" não existe em /hunters' },
    ])
  })

  it.each([['todos'], [[]], [42]])('reports %j as recipients', (to) => {
    const raw = validCampaign()
    raw.messages[0].to = to

    expect(parseCampaign(raw).errors).toContainEqual(expect.objectContaining({ path: '/messages/0/to' }))
  })

  it('reports a message without its fiction time', () => {
    const raw = validCampaign()
    delete raw.messages[0].sentAt

    expect(parseCampaign(raw).errors).toContainEqual(expect.objectContaining({ path: '/messages/0/sentAt' }))
  })
})

describe('hunter fields in the schema', () => {
  it.each([-1, 5.5, 'cinco'])('reports %j as a rating', (rating) => {
    const raw = validCampaign()
    raw.hunters[0].rating = rating

    expect(parseCampaign(raw).errors).toContainEqual(expect.objectContaining({ path: '/hunters/0/rating' }))
  })
})

describe('validation messages', () => {
  it('are in Portuguese', () => {
    const raw = validCampaign()
    raw.missions[1].value = 'cem'

    expect(parseCampaign(raw).errors).toContainEqual({ path: '/missions/1/value', message: 'deve ser um número' })
  })
})

describe('reporting every error at once', () => {
  it('reports schema and reference errors together', () => {
    const raw = validCampaign()
    raw.missions[0].value = 'cem'
    raw.missions[1].hunters = ['zeca']

    const paths = parseCampaign(raw).errors.map(error => error.path)

    expect(paths).toEqual(expect.arrayContaining(['/missions/0/value', '/missions/1/hunters/0']))
  })

  it.each([
    ['hunters is not a list', raw => { raw.hunters = 'ana' }],
    ['a mission is not an object', raw => { raw.missions[0] = null }],
    ['nearHunters is not a list', raw => { raw.missions[0].nearHunters = 'ana' }],
    ['a message is not an object', raw => { raw.messages[0] = 7 }],
    ['recipients are not a list', raw => { raw.messages[0].to = 3 }],
  ])('does not crash when %s', (_, breakIt) => {
    const raw = validCampaign()
    breakIt(raw)

    expect(parseCampaign(raw).ok).toBe(false)
  })
})

describe('a message without NPC', () => {
  it('reports only the missing field', () => {
    const raw = validCampaign()
    delete raw.messages[0].npc

    expect(parseCampaign(raw).errors.map(e => e.path)).toEqual(['/messages/0/npc'])
  })
})
