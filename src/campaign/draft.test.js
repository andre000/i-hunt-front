import { describe, expect, it } from 'vitest'
import { addItem, advanceToNextScheduled, blankDraft, addMessage, explainErrors, hunterImpact, messageOrder, messageScheduled, missionPreview, moveItem, parseCoordinates, setMissionPosition, removeHunter, removeItem, removeNpc, updateItem, dateFromInput, dateToInput, draftErrors, nextScheduled, draftFile, draftFileName, draftFrom, readDraftText, updateCampaign } from './draft'
import { validCampaign } from './fixtures'

describe('draftFrom', () => {
  it('keeps the campaign of a valid file', () => {
    const draft = draftFrom(validCampaign())

    expect(draft.campaign.name).toBe('Noite em Porto Alegre')
    expect(draft.hunters.map(hunter => hunter.name)).toEqual(['Ana', 'Beto'])
    expect(draftErrors(draft)).toEqual([])
  })
})

describe('a draft with validation errors', () => {
  it('opens a file with errors and lists them by path', () => {
    const raw = validCampaign()
    raw.missions[1].value = 'cem'

    const draft = draftFrom(raw)

    expect(draft.missions[1].value).toBe('cem')
    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/missions/1/value' }))
  })

  it('opens a file without sections as an empty campaign', () => {
    const draft = draftFrom({ campaign: { name: 'Nova' } })

    expect(draft.hunters).toEqual([])
    expect(draft.missions).toEqual([])
    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/campaign/date' }))
  })

  it('does not change the file it came from', () => {
    const raw = validCampaign()
    const draft = draftFrom(raw)

    draft.hunters[0].name = 'Outra'

    expect(raw.hunters[0].name).toBe('Ana')
  })
})

describe('updateCampaign', () => {
  it('renames the campaign without touching the rest', () => {
    const draft = updateCampaign(draftFrom(validCampaign()), { name: 'Noite em Pelotas' })

    expect(draft.campaign).toEqual({ name: 'Noite em Pelotas', date: '2026-10-04T21:00:00-03:00' })
    expect(draft.hunters).toHaveLength(2)
  })

  it('reports an empty name as an error', () => {
    const draft = updateCampaign(draftFrom(validCampaign()), { name: '' })

    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/campaign/name' }))
  })
})

describe('draftFile', () => {
  const SCHEMA = 'https://ihunt.test/campaign.schema.json'

  it('starts with the $schema of the app', () => {
    const text = draftFile(draftFrom(validCampaign()), { schemaUrl: SCHEMA })

    expect(Object.keys(JSON.parse(text))[0]).toBe('$schema')
    expect(JSON.parse(text).$schema).toBe(SCHEMA)
  })

  it('replaces the $schema the file had', () => {
    const raw = { $schema: './campaign.schema.json', ...validCampaign() }

    const text = draftFile(draftFrom(raw), { schemaUrl: SCHEMA })

    expect(JSON.parse(text).$schema).toBe(SCHEMA)
  })

  it('is indented and keeps the campaign', () => {
    const text = draftFile(draftFrom(validCampaign()), { schemaUrl: SCHEMA })

    expect(text).toContain('\n  "campaign": {\n    "name": "Noite em Porto Alegre",')
    expect(JSON.parse(text).missions[2].name).toBe('Vampiro no bar')
  })
})

describe('draftFileName', () => {
  it('uses the name of the published file', () => {
    expect(draftFileName('https://pub-123.r2.dev/mesas/noites.json?v=2')).toBe('noites.json')
  })

  it('is campanha.json without a published file', () => {
    expect(draftFileName(null)).toBe('campanha.json')
  })
})

describe('blankDraft', () => {
  it('is a minimal campaign dated now, with the local time zone', () => {
    const now = new Date('2026-10-05T15:42:10Z')

    const draft = blankDraft(now)

    expect(draft.campaign.name).toBe('Nova campanha')
    expect(draft.campaign.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00([+-]\d{2}:\d{2}|Z)$/)
    expect(new Date(draft.campaign.date).getTime()).toBe(new Date('2026-10-05T15:42:00Z').getTime())
    expect(draft.hunters).toEqual([])
    expect(draftErrors(draft).map(error => error.path)).toEqual(['/hunters'])
  })
})

describe('readDraftText', () => {
  it('reads the JSON of a file', () => {
    expect(readDraftText(JSON.stringify(validCampaign())).draft.campaign.name).toBe('Noite em Porto Alegre')
  })

  it('explains when the file is not readable JSON', () => {
    expect(readDraftText('{ "campaign": ').error).toMatch(/^O arquivo não é um JSON legível/)
  })

  it('explains when the JSON is not an object', () => {
    expect(readDraftText('[1, 2]').error).toMatch(/^O arquivo não é um JSON legível/)
  })
})

describe('dates typed without a time zone', () => {
  const CAMPAIGN_DATE = '2026-10-04T21:00:00-03:00'

  it('shows a date as the time of the campaign zone', () => {
    expect(dateToInput('2026-10-05T03:30:00Z', CAMPAIGN_DATE)).toBe('2026-10-05T00:30')
  })

  it('keeps the time as written when the zone is the same', () => {
    expect(dateToInput('2026-10-04T21:00:00-03:00', CAMPAIGN_DATE)).toBe('2026-10-04T21:00')
  })

  it('stores a typed time with the zone of the campaign date', () => {
    expect(dateFromInput('2026-10-05T00:30', CAMPAIGN_DATE)).toBe('2026-10-05T00:30:00-03:00')
  })

  it('uses Z when the campaign date is in UTC', () => {
    expect(dateFromInput('2026-10-05T00:30', '2026-10-04T21:00:00Z')).toBe('2026-10-05T00:30:00Z')
  })

  it('shows an empty field for a missing or broken date', () => {
    expect(dateToInput(undefined, CAMPAIGN_DATE)).toBe('')
    expect(dateToInput('amanhã', CAMPAIGN_DATE)).toBe('')
  })

  it('stores nothing for an empty field', () => {
    expect(dateFromInput('', CAMPAIGN_DATE)).toBeUndefined()
  })
})

describe('next scheduled', () => {
  function draftWith({ missions = [], messages = [] }) {
    const raw = validCampaign()
    raw.missions.push(...missions.map((postedAt, index) => ({ id: `s${index}`, name: 'S', location: 'C', value: 1, risk: 'baixo', postedAt })))
    raw.messages = messages.map((sentAt, index) => ({ id: `n${index}`, npc: 'padre', to: 'all', sentAt, text: 'Oi' }))
    return draftFrom(raw)
  }

  it('is the earliest mission or message after the campaign date', () => {
    const draft = draftWith({
      missions: ['2026-10-05T02:00:00-03:00', '2026-10-04T20:00:00-03:00'],
      messages: ['2026-10-05T02:00:00Z', '2026-10-04T22:30:00-03:00'],
    })

    expect(nextScheduled(draft)).toBe('2026-10-04T22:30:00-03:00')
  })

  it('compares instants, not text, across time zones', () => {
    const draft = draftWith({ missions: ['2026-10-05T03:00:00Z'], messages: ['2026-10-05T01:00:00-03:00'] })

    expect(nextScheduled(draft)).toBe('2026-10-05T03:00:00Z')
  })

  it('is null when nothing is scheduled', () => {
    const draft = draftWith({ messages: ['2026-10-04T21:00:00-03:00'] })

    expect(nextScheduled(draft)).toBeNull()
  })

  it('advances the campaign date to it, in the campaign zone', () => {
    const draft = draftWith({ messages: ['2026-10-05T03:00:00Z'] })

    expect(advanceToNextScheduled(draft).campaign.date).toBe('2026-10-05T00:00:00-03:00')
  })

  it('advances to the exact second, so the item is no longer scheduled', () => {
    const draft = draftWith({ messages: ['2026-10-04T22:10:45-03:00'] })

    const advanced = advanceToNextScheduled(draft)

    expect(advanced.campaign.date).toBe('2026-10-04T22:10:45-03:00')
    expect(nextScheduled(advanced)).toBeNull()
  })

  it('leaves the draft alone when nothing is scheduled', () => {
    const draft = draftWith({})

    expect(advanceToNextScheduled(draft)).toBe(draft)
  })
})

describe('ids made from the name', () => {
  it('is lowercase, without accents, with hyphens', () => {
    const draft = addItem(draftFrom(validCampaign()), 'hunters', { name: 'João da Silva' })

    expect(draft.hunters.at(-1)).toEqual({ id: 'joao-da-silva', name: 'João da Silva' })
  })

  it('never repeats an id of the section', () => {
    let draft = addItem(draftFrom(validCampaign()), 'hunters', { name: 'Ana' })
    draft = addItem(draft, 'hunters', { name: 'ANA!' })

    expect(draft.hunters.map(hunter => hunter.id)).toEqual(['ana', 'beto', 'ana-2', 'ana-3'])
  })

  it('has a fallback for a name without letters', () => {
    const draft = addItem(draftFrom(validCampaign()), 'hunters', { name: '???' })

    expect(draft.hunters.at(-1).id).toBe('hunter')
  })

  it('does not change when the item is renamed', () => {
    const draft = updateItem(draftFrom(validCampaign()), 'hunters', 0, { name: 'Ana Souza', id: 'outra' })

    expect(draft.hunters[0]).toMatchObject({ id: 'ana', name: 'Ana Souza' })
  })
})

describe('updateItem', () => {
  it('removes a field left empty', () => {
    const draft = updateItem(draftFrom(validCampaign()), 'hunters', 0, { avatar: undefined, rating: 3 })

    expect(draft.hunters[0]).toEqual({ id: 'ana', name: 'Ana', rating: 3 })
  })
})

describe('removing a hunter', () => {
  function draftWithAnaEverywhere() {
    const raw = validCampaign()
    raw.missions[2].hunters = ['ana', 'beto']
    return draftFrom(raw)
  }

  it('lists the missions and messages where the hunter appears', () => {
    const impact = hunterImpact(draftWithAnaEverywhere(), 0)

    expect(impact.missions).toEqual(['Lobisomem no Bom Fim', 'Fantasma no ônibus T5', 'Vampiro no bar'])
    expect(impact.messages).toEqual(['Ana, venha à igreja.', 'Ana, cuidado.'])
  })

  it('warns about messages that would have no recipient', () => {
    const raw = validCampaign()
    raw.messages[1].to = ['ana', 'beto']

    const impact = hunterImpact(draftFrom(raw), 0)

    expect(impact.withoutRecipient).toEqual(['Ana, cuidado.'])
  })

  it('takes the hunter out of every mission and message', () => {
    const draft = removeHunter(draftWithAnaEverywhere(), 0)

    expect(draft.hunters.map(hunter => hunter.id)).toEqual(['beto'])
    expect(draft.missions.map(mission => mission.nearHunters ?? [])).toEqual([[], ['beto'], []])
    expect(draft.missions[2].hunters).toEqual(['beto'])
    expect(draft.messages.map(message => message.to)).toEqual(['all', [], ['beto'], [], 'all'])
  })

  it('leaves the messages without recipient as errors to fix', () => {
    const draft = removeHunter(draftWithAnaEverywhere(), 0)

    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/messages/1/to' }))
  })
})

describe('removing a NPC', () => {
  it('refuses when the NPC has messages and says how many', () => {
    const draft = draftFrom(validCampaign())

    expect(removeNpc(draft, 0)).toEqual({ ok: false, messages: 3 })
  })

  it('removes a NPC without messages', () => {
    const draft = addItem(draftFrom(validCampaign()), 'npcs', { name: 'Vizinha' })

    const result = removeNpc(draft, 2)

    expect(result.ok).toBe(true)
    expect(result.draft.npcs.map(npc => npc.id)).toEqual(['dona-rosa', 'padre'])
  })
})

describe('missionPreview', () => {
  function draftWithMission(fields) {
    return addItem(draftFrom(validCampaign()), 'missions', { name: 'Nova', location: 'Centro', value: 100, risk: 'baixo', ...fields })
  }

  it('is Disponível for a new mission', () => {
    expect(missionPreview(draftWithMission({}), 3)).toEqual({ status: 'available', scheduled: false })
  })

  it('follows hunters, result and deadline like the app', () => {
    expect(missionPreview(draftWithMission({ hunters: ['ana'] }), 3).status).toBe('in-progress')
    expect(missionPreview(draftWithMission({ result: 'fracassada' }), 3).status).toBe('failed')
    expect(missionPreview(draftWithMission({ deadline: '2026-10-04T20:00:00-03:00' }), 3).status).toBe('expired')
  })

  it('is Agendado until the campaign date passes the publication time', () => {
    const draft = draftWithMission({ postedAt: '2026-10-04T22:00:00-03:00' })

    expect(missionPreview(draft, 3).scheduled).toBe(true)
    expect(missionPreview(advanceToNextScheduled(draft), 3).scheduled).toBe(false)
  })
})

describe('removeItem', () => {
  it('removes a mission', () => {
    const draft = removeItem(draftFrom(validCampaign()), 'missions', 1)

    expect(draft.missions.map(mission => mission.id)).toEqual(['m1', 'm3'])
  })
})

describe('mission position', () => {
  it('sets the position picked on the map, rounded to 6 decimals', () => {
    const draft = setMissionPosition(draftFrom(validCampaign()), 0, { lat: -30.034612345, lng: -51.217712345 })

    expect(draft.missions[0].position).toEqual({ lat: -30.034612, lng: -51.217712 })
    expect(draftErrors(draft)).toEqual([])
  })

  it('removes the position', () => {
    const raw = validCampaign()
    raw.missions[0].position = { lat: -30, lng: -51 }

    const draft = setMissionPosition(draftFrom(raw), 0, null)

    expect(draft.missions[0]).not.toHaveProperty('position')
  })

  it('keeps a half-typed position so the error points to the missing field', () => {
    const draft = setMissionPosition(draftFrom(validCampaign()), 0, { lat: -30, lng: undefined })

    expect(draft.missions[0].position).toEqual({ lat: -30 })
    expect(draftErrors(draft)).toContainEqual(expect.objectContaining({ path: '/missions/0/position/lng' }))
  })
})

describe('mission position with both fields empty', () => {
  it('removes the position', () => {
    const draft = setMissionPosition(draftFrom(validCampaign()), 0, { lat: undefined, lng: undefined })

    expect(draft.missions[0]).not.toHaveProperty('position')
  })
})

describe('parseCoordinates', () => {
  it('reads "lat, lng" pasted from a map', () => {
    expect(parseCoordinates('-30.0346, -51.2177')).toEqual({ lat: -30.0346, lng: -51.2177 })
    expect(parseCoordinates(' -30.0346 -51.2177 ')).toEqual({ lat: -30.0346, lng: -51.2177 })
  })

  it('is null for a single number or text', () => {
    expect(parseCoordinates('-30.0346')).toBeNull()
    expect(parseCoordinates('Bom Fim')).toBeNull()
  })
})

describe('moveItem', () => {
  const ids = (draft) => draft.missions.map(mission => mission.id)

  it('moves a mission down', () => {
    expect(ids(moveItem(draftFrom(validCampaign()), 'missions', 0, 2))).toEqual(['m2', 'm3', 'm1'])
  })

  it('moves a mission up', () => {
    expect(ids(moveItem(draftFrom(validCampaign()), 'missions', 2, 0))).toEqual(['m3', 'm1', 'm2'])
  })

  it('leaves the draft alone for the same place or a place outside the list', () => {
    const draft = draftFrom(validCampaign())

    expect(moveItem(draft, 'missions', 1, 1)).toBe(draft)
    expect(moveItem(draft, 'missions', 1, 5)).toBe(draft)
  })
})

describe('messages', () => {
  it('starts a message from a NPC to everyone, at the campaign date', () => {
    const draft = addMessage(draftFrom(validCampaign()), { npc: 'padre' })

    expect(draft.messages.at(-1)).toEqual({ id: expect.stringMatching(/^msg-padre-[a-z0-9]+$/), npc: 'padre', to: 'all', sentAt: '2026-10-04T21:00:00-03:00', text: '' })
    expect(messageScheduled(draft, 5)).toBe(false)
  })

  it('never repeats a message id, even when written in the same instant', () => {
    const now = new Date('2026-10-05T15:00:00Z')
    let draft = addMessage(draftFrom(validCampaign()), { npc: 'padre' }, now)
    draft = addMessage(draft, { npc: 'padre' }, now)

    const [first, second] = draft.messages.slice(-2).map(message => message.id)
    expect(first).not.toBe(second)
  })

  it('never reuses the id of a deleted message, so players see the new one as unread', () => {
    let draft = addMessage(draftFrom(validCampaign()), { npc: 'padre' }, new Date('2026-10-05T15:00:00Z'))
    const deletedId = draft.messages.at(-1).id
    draft = removeItem(draft, 'messages', 5)

    draft = addMessage(draft, { npc: 'padre' }, new Date('2026-10-05T15:07:00Z'))

    expect(draft.messages.at(-1).id).not.toBe(deletedId)
  })

  it('is Agendado when sent after the campaign date', () => {
    expect(messageScheduled(draftFrom(validCampaign()), 4)).toBe(true)
  })

  it('orders the messages by time, across time zones', () => {
    const raw = validCampaign()
    raw.messages[0].sentAt = '2026-10-05T03:00:00Z'

    expect(messageOrder(draftFrom(raw))).toEqual([1, 2, 3, 4, 0])
  })

  it('puts messages without a valid time at the end, keeping their order', () => {
    const raw = validCampaign()
    raw.messages[1].sentAt = 'ontem'

    expect(messageOrder(draftFrom(raw))).toEqual([0, 2, 3, 4, 1])
  })
})

describe('explainErrors', () => {
  function brokenDraft() {
    const raw = validCampaign()
    raw.campaign.name = ''
    raw.hunters[1].rating = 9
    delete raw.missions[0].value
    raw.messages[1].to = []
    raw.messages[2].npc = 'x'
    return draftFrom(raw)
  }

  it('says which item has the problem and how to open it', () => {
    const errors = explainErrors(brokenDraft())

    expect(errors.map(({ where, target }) => ({ where, target }))).toEqual([
      { where: 'Campanha', target: { section: 'campaign' } },
      { where: 'Hunter “Beto”', target: { section: 'hunters', index: 1 } },
      { where: 'Missão “Lobisomem no Bom Fim”', target: { section: 'missions', index: 0 } },
      { where: 'Mensagem “Ana, venha à igreja.”', target: { section: 'messages', index: 1 } },
      { where: 'Mensagem “Beto, só para você.”', target: { section: 'messages', index: 2 } },
    ])
  })

  it('explains in plain words', () => {
    const messages = explainErrors(brokenDraft()).map(error => error.message)

    expect(messages).toEqual([
      'Nome: não pode ficar vazio.',
      'Avaliação: deve ser <= 5',
      'Falta o valor.',
      'Escolha pelo menos um destinatário.',
      'NPC "x" não existe em /npcs',
    ])
  })

  it('keeps the path for whoever edits the file by hand', () => {
    expect(explainErrors(brokenDraft())[2].path).toBe('/missions/0/value')
  })

  it('asks for a first hunter and opens the new hunter form', () => {
    expect(explainErrors(blankDraft())).toEqual([
      { path: '/hunters', where: 'Hunters', message: 'Adicione pelo menos um hunter.', target: { section: 'hunters', adding: true } },
    ])
  })

  it('cuts a long message text in the place name', () => {
    const raw = validCampaign()
    raw.messages[0].text = 'Uma mensagem bem comprida que passa do limite do nome'
    raw.messages[0].npc = 'x'

    expect(explainErrors(draftFrom(raw))[0].where).toBe('Mensagem “Uma mensagem bem comprida…”')
  })
})
