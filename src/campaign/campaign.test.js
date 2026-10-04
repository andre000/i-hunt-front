import { describe, expect, it } from 'vitest'
import {
  conversation,
  findHunter,
  inbox,
  unreadTotal,
  findMission,
  gmView,
  homeView,
  hunterProfile,
  missionDetail,
  missionList,
  parseCampaign,
  relativeToCampaign,
  visibleMissions,
} from './campaign'
import { validCampaign } from './fixtures'

function parsed(raw = validCampaign()) {
  const result = parseCampaign(raw)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.campaign
}

describe('parseCampaign', () => {
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

describe('homeView', () => {
  it('shows the featured mission and the missions near the hunter', () => {
    const view = homeView(parsed(), 'ana')

    expect(view.featured.id).toBe('m1')
    expect(view.nearby.map(m => m.id)).toEqual(['m2'])
    expect(view.available).toBe(3)
  })

  it('lists only missions near the chosen hunter', () => {
    const view = homeView(parsed(), 'beto')

    expect(view.nearby.map(m => m.id)).toEqual(['m2'])
  })

  it('uses the first featured mission when the GM marks more than one', () => {
    const raw = validCampaign()
    raw.missions[2].featured = true

    expect(homeView(parsed(raw), 'ana').featured.id).toBe('m1')
  })

  it('has no featured mission when none is marked', () => {
    const raw = validCampaign()
    raw.missions[0].featured = false

    const view = homeView(parsed(raw), 'ana')

    expect(view.featured).toBeNull()
    expect(view.nearby.map(m => m.id)).toEqual(['m1', 'm2'])
  })
})

describe('findHunter and findMission', () => {
  it('find by id', () => {
    const campaign = parsed()

    expect(findHunter(campaign, 'beto').name).toBe('Beto')
    expect(findMission(campaign, 'm2').name).toBe('Fantasma no ônibus T5')
  })

  it('return null for unknown or missing ids', () => {
    const campaign = parsed()

    expect(findHunter(campaign, 'carla')).toBeNull()
    expect(findHunter(campaign, null)).toBeNull()
    expect(findMission(campaign, 'm9')).toBeNull()
  })
})

const CAMPAIGN_DATE = '2026-10-04T21:00:00-03:00'

function campaignWith(...missions) {
  const raw = validCampaign()
  raw.missions = missions.map((mission, index) => ({
    id: `x${index}`,
    name: `Missão ${index}`,
    location: 'Centro',
    value: 100,
    risk: 'baixo',
    ...mission,
  }))
  return parsed(raw)
}

function statusOf(mission) {
  return visibleMissions(campaignWith(mission))[0].status
}

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

describe('mission status', () => {
  it('is available with no hunters and no result', () => {
    expect(statusOf({})).toBe('available')
  })

  it('is in progress with hunters on it', () => {
    expect(statusOf({ hunters: ['ana'] })).toBe('in-progress')
  })

  it('is completed or failed when the GM sets the result', () => {
    expect(statusOf({ hunters: ['ana'], result: 'concluída' })).toBe('completed')
    expect(statusOf({ hunters: ['ana'], result: 'fracassada' })).toBe('failed')
  })

  it('is expired when an available mission passes its deadline on the campaign date', () => {
    expect(statusOf({ deadline: '2026-10-04T20:59:00-03:00' })).toBe('expired')
  })

  it('is still available before the deadline on the campaign date', () => {
    expect(statusOf({ deadline: '2026-10-04T21:01:00-03:00' })).toBe('available')
  })

  it('does not expire while hunters are on it', () => {
    expect(statusOf({ hunters: ['ana'], deadline: '2026-10-01T00:00:00-03:00' })).toBe('in-progress')
  })

  it('compares deadlines across time zones', () => {
    expect(statusOf({ deadline: '2026-10-04T23:30:00Z' })).toBe('expired')
    expect(statusOf({ deadline: '2026-10-05T00:30:00Z' })).toBe('available')
  })
})

describe('scheduled missions', () => {
  const campaign = () => campaignWith(
    { id: 'now', postedAt: '2026-10-04T20:00:00-03:00', featured: true, nearHunters: ['ana'] },
    { id: 'later', postedAt: '2026-10-04T22:00:00-03:00', featured: true, nearHunters: ['ana'] },
    { id: 'always' },
  )

  it('are hidden from the visible missions', () => {
    expect(visibleMissions(campaign()).map(m => m.id)).toEqual(['now', 'always'])
  })

  it('never become the featured mission or a nearby mission', () => {
    const raw = campaign()
    raw.missions[0].featured = false
    raw.missions[0].nearHunters = []

    const view = homeView(raw, 'ana')

    expect(view.featured).toBeNull()
    expect(view.nearby).toEqual([])
  })

  it('are not found in the mission detail', () => {
    expect(missionDetail(campaign(), 'later')).toBeNull()
    expect(missionDetail(campaign(), 'now').id).toBe('now')
  })

  it('are not counted', () => {
    expect(homeView(campaign(), 'ana').available).toBe(2)
  })
})

describe('home with mission status', () => {
  it('shows only open missions and counts only available ones', () => {
    const campaign = campaignWith(
      { id: 'done', featured: true, hunters: ['ana'], result: 'concluída', nearHunters: ['ana'] },
      { id: 'busy', hunters: ['beto'], nearHunters: ['ana'] },
      { id: 'late', deadline: '2026-10-01T00:00:00-03:00', nearHunters: ['ana'] },
      { id: 'open', featured: true, nearHunters: ['ana'] },
      { id: 'far' },
    )

    const view = homeView(campaign, 'ana')

    expect(view.featured.id).toBe('open')
    expect(view.nearby.map(m => m.id)).toEqual(['busy'])
    expect(view.available).toBe(2)
  })
})

describe('missionDetail', () => {
  it('shows the status and the names of the hunters on the mission', () => {
    const campaign = campaignWith({ id: 'm', hunters: ['beto', 'ana'] })

    expect(missionDetail(campaign, 'm')).toMatchObject({ status: 'in-progress', hunterNames: ['Beto', 'Ana'] })
  })

  it('returns null for an unknown mission', () => {
    expect(missionDetail(campaignWith({}), 'nada')).toBeNull()
  })
})

describe('relativeToCampaign', () => {
  it.each([
    ['2026-10-07T21:00:00-03:00', 'em 3 dias'],
    ['2026-10-06T21:00:00-03:00', 'depois de amanhã'],
    ['2026-10-05T21:00:00-03:00', 'amanhã'],
    ['2026-10-04T23:00:00-03:00', 'em 2 horas'],
    ['2026-10-04T20:30:00-03:00', 'há 30 minutos'],
    ['2026-10-01T21:00:00-03:00', 'há 3 dias'],
  ])('describes %s relative to the campaign date', (date, text) => {
    expect(relativeToCampaign(date, CAMPAIGN_DATE)).toBe(text)
  })
})

describe('missionList', () => {
  const campaign = () => campaignWith(
    { id: 'open-low', risk: 'baixo' },
    { id: 'busy-high', risk: 'alto', hunters: ['ana'] },
    { id: 'done-mid', risk: 'médio', hunters: ['ana'], result: 'concluída' },
    { id: 'late-high', risk: 'alto', deadline: '2026-10-01T00:00:00-03:00' },
    { id: 'later', risk: 'baixo', postedAt: '2026-10-05T00:00:00-03:00' },
  )
  const ids = (missions) => missions.map(m => m.id)

  it('lists every visible mission in the order of the JSON without filters', () => {
    expect(ids(missionList(campaign()))).toEqual(['open-low', 'busy-high', 'done-mid', 'late-high'])
  })

  it('filters by status', () => {
    expect(ids(missionList(campaign(), { statuses: ['expired'] }))).toEqual(['late-high'])
  })

  it('keeps missions matching any of the chosen statuses', () => {
    expect(ids(missionList(campaign(), { statuses: ['available', 'completed'] }))).toEqual(['open-low', 'done-mid'])
  })

  it('filters by risk', () => {
    expect(ids(missionList(campaign(), { risks: ['alto'] }))).toEqual(['busy-high', 'late-high'])
  })

  it('combines status and risk', () => {
    expect(ids(missionList(campaign(), { statuses: ['in-progress', 'available'], risks: ['alto'] }))).toEqual(['busy-high'])
  })

  it('never lists scheduled missions', () => {
    expect(ids(missionList(campaign(), { risks: ['baixo'] }))).toEqual(['open-low'])
  })

  it('returns nothing when no mission matches', () => {
    expect(missionList(campaign(), { statuses: ['failed'] })).toEqual([])
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

describe('inbox', () => {
  it('groups the messages for the hunter by NPC, latest conversation first', () => {
    const conversations = inbox(parsed(), 'ana', [])

    expect(conversations.map(c => c.npc.id)).toEqual(['dona-rosa', 'padre'])
    expect(conversations[0].lastMessage.text).toBe('Ana, cuidado.')
    expect(conversations[1].lastMessage.text).toBe('Ana, venha à igreja.')
  })

  it('does not show messages sent only to other hunters', () => {
    const texts = inbox(parsed(), 'beto', []).map(c => c.lastMessage.text)

    expect(texts).toEqual(['Beto, só para você.'])
  })

  it('does not show scheduled messages', () => {
    const padre = inbox(parsed(), 'beto', []).find(c => c.npc.id === 'padre')

    expect(padre).toBeUndefined()
  })

  it('counts unread messages per conversation', () => {
    const conversations = inbox(parsed(), 'ana', ['msg1'])

    expect(conversations.map(c => c.unread)).toEqual([1, 1])
  })
})

describe('conversation', () => {
  it('lists the visible messages of one NPC in fiction-time order', () => {
    const { npc, messages } = conversation(parsed(), 'ana', 'dona-rosa')

    expect(npc.name).toBe('Dona Rosa')
    expect(messages.map(m => m.id)).toEqual(['msg1', 'msg4'])
  })

  it('orders by fiction time even when the JSON is out of order', () => {
    const raw = validCampaign()
    raw.messages.reverse()

    expect(conversation(parsed(raw), 'ana', 'dona-rosa').messages.map(m => m.id)).toEqual(['msg1', 'msg4'])
  })

  it('is null for an NPC with nothing visible to the hunter', () => {
    expect(conversation(parsed(), 'beto', 'padre')).toBeNull()
    expect(conversation(parsed(), 'ana', 'ninguem')).toBeNull()
  })
})

describe('unreadTotal', () => {
  it('counts the unread visible messages of the hunter', () => {
    expect(unreadTotal(parsed(), 'ana', [])).toBe(3)
    expect(unreadTotal(parsed(), 'ana', ['msg1', 'msg2', 'msg3'])).toBe(1)
  })
})

describe('hunter fields in the schema', () => {
  it.each([-1, 5.5, 'cinco'])('reports %j as a rating', (rating) => {
    const raw = validCampaign()
    raw.hunters[0].rating = rating

    expect(parseCampaign(raw).errors).toContainEqual(expect.objectContaining({ path: '/hunters/0/rating' }))
  })
})

describe('hunterProfile', () => {
  const campaign = () => campaignWith(
    { id: 'solo', value: 300, hunters: ['ana'], result: 'concluída' },
    { id: 'split', value: 500, hunters: ['ana', 'beto'], result: 'concluída' },
    { id: 'lost', value: 1000, hunters: ['ana'], result: 'fracassada' },
    { id: 'busy', value: 200, hunters: ['ana', 'beto'] },
    { id: 'other', value: 900, hunters: ['beto'], result: 'concluída' },
    { id: 'future', value: 700, hunters: ['ana'], result: 'concluída', postedAt: '2026-10-05T00:00:00-03:00' },
  )

  it('shows the chosen hunter', () => {
    expect(hunterProfile(campaign(), 'ana').hunter).toMatchObject({ name: 'Ana', rating: 4.5 })
  })

  it('splits the value of each completed mission among its hunters', () => {
    expect(hunterProfile(campaign(), 'ana').earnings).toBe(300 + 250)
    expect(hunterProfile(campaign(), 'beto').earnings).toBe(250 + 900)
  })

  it('separates missions in progress from completed ones', () => {
    const profile = hunterProfile(campaign(), 'ana')

    expect(profile.inProgress.map(m => m.id)).toEqual(['busy'])
    expect(profile.completed.map(m => m.id)).toEqual(['solo', 'split'])
  })

  it('has no earnings or missions for a hunter on no mission', () => {
    const raw = validCampaign()
    raw.hunters.push({ id: 'carla', name: 'Carla' })

    expect(hunterProfile(parsed(raw), 'carla')).toMatchObject({ earnings: 0, inProgress: [], completed: [] })
  })

  it('is null for an unknown hunter', () => {
    expect(hunterProfile(campaign(), 'zeca')).toBeNull()
  })
})

describe('validation messages', () => {
  it('are in Portuguese', () => {
    const raw = validCampaign()
    raw.missions[1].value = 'cem'

    expect(parseCampaign(raw).errors).toContainEqual({ path: '/missions/1/value', message: 'deve ser um número' })
  })
})

describe('gmView', () => {
  const campaign = () => campaignWith(
    { id: 'done', value: 400, hunters: ['ana', 'beto'], result: 'concluída' },
    { id: 'open' },
    { id: 'later', postedAt: '2026-10-05T10:00:00-03:00', hunters: ['ana'], result: 'concluída', value: 1000 },
  )

  it('shows the campaign date', () => {
    expect(gmView(campaign()).date).toBe('2026-10-04T21:00:00-03:00')
  })

  it('lists every hunter with rating and earnings', () => {
    const { hunters } = gmView(campaign())

    expect(hunters.map(({ hunter, earnings }) => [hunter.id, hunter.rating, earnings])).toEqual([
      ['ana', 4.5, 200],
      ['beto', undefined, 200],
    ])
  })

  it('lists every mission with status, including scheduled ones marked as such', () => {
    const { missions } = gmView(campaign())

    expect(missions.map(m => [m.id, m.status, m.scheduled])).toEqual([
      ['done', 'completed', false],
      ['open', 'available', false],
      ['later', 'completed', true],
    ])
  })
})
