import { parseCampaign } from './parseCampaign'
import { isAfterCampaignDate, time } from './time'
import { isScheduled, missionView } from './missions'
import { isDate, localIso, wallTime, zoneOf } from './draftDates'

export const SECTIONS = {
  hunters: { fallbackId: 'hunter', place: 'Hunter' },
  missions: { fallbackId: 'missao', place: 'Missão' },
  npcs: { fallbackId: 'npc', place: 'NPC' },
  messages: { fallbackId: 'mensagem', place: 'Mensagem' },
}

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function draftFrom(raw) {
  const source = isObject(raw) ? raw : {}
  const draft = structuredClone(source)
  draft.campaign = isObject(source.campaign) ? draft.campaign : {}
  for (const section of Object.keys(SECTIONS)) {
    if (!Array.isArray(source[section])) draft[section] = []
  }
  return draft
}

export function updateCampaign(draft, changes) {
  return { ...draft, campaign: { ...draft.campaign, ...changes } }
}

function slug(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueId(draft, section, name) {
  const taken = new Set(draft[section].map(item => item?.id))
  const base = slug(name) || SECTIONS[section].fallbackId
  if (!taken.has(base)) return base
  let number = 2
  while (taken.has(`${base}-${number}`)) number += 1
  return `${base}-${number}`
}

const withoutEmpty = (item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined))

export function addItem(draft, section, fields) {
  const item = withoutEmpty({ id: uniqueId(draft, section, fields.name), ...fields })
  return { ...draft, [section]: [...draft[section], item] }
}

export function updateItem(draft, section, index, changes) {
  const rest = { ...changes }
  delete rest.id
  const items = draft[section].map((item, at) => (at === index ? withoutEmpty({ ...item, ...rest }) : item))
  return { ...draft, [section]: items }
}

export function removeItem(draft, section, index) {
  return { ...draft, [section]: draft[section].filter((_, at) => at !== index) }
}

export function moveItem(draft, section, from, to) {
  const items = draft[section]
  const inside = (index) => index >= 0 && index < items.length
  if (from === to || !inside(from) || !inside(to)) return draft
  const moved = items.filter((_, at) => at !== from)
  moved.splice(to, 0, items[from])
  return { ...draft, [section]: moved }
}

export function removeNpc(draft, index) {
  const { id } = draft.npcs[index]
  const messages = draft.messages.filter(message => message?.npc === id).length
  return messages > 0 ? { ok: false, messages } : { ok: true, draft: removeItem(draft, 'npcs', index) }
}

const includes = (list, id) => Array.isArray(list) && list.includes(id)
const without = (list, id) => (Array.isArray(list) ? list.filter(item => item !== id) : list)

export function hunterImpact(draft, index) {
  const { id } = draft.hunters[index]
  const messages = draft.messages.filter(message => includes(message.to, id))
  return {
    missions: draft.missions
      .filter(mission => includes(mission.hunters, id) || includes(mission.nearHunters, id))
      .map(mission => mission.name),
    messages: messages.map(message => message.text),
    withoutRecipient: messages.filter(message => message.to.length === 1).map(message => message.text),
  }
}

export function removeHunter(draft, index) {
  const { id } = draft.hunters[index]
  const missions = draft.missions.map(mission => {
    if (!includes(mission.hunters, id) && !includes(mission.nearHunters, id)) return mission
    return withoutEmpty({ ...mission, hunters: without(mission.hunters, id), nearHunters: without(mission.nearHunters, id) })
  })
  const messages = draft.messages.map(message => (includes(message.to, id) ? { ...message, to: without(message.to, id) } : message))
  return { ...removeItem(draft, 'hunters', index), missions, messages }
}

const roundCoordinate = (value) => (typeof value === 'number' ? Math.round(value * 1e6) / 1e6 : value)

export function setMissionPosition(draft, index, position) {
  const value = position && withoutEmpty({ lat: roundCoordinate(position.lat), lng: roundCoordinate(position.lng) })
  return updateItem(draft, 'missions', index, { position: value && Object.keys(value).length > 0 ? value : undefined })
}

export function parseCoordinates(text) {
  const numbers = String(text).trim().split(/[\s,;]+/).map(Number)
  if (numbers.length !== 2 || numbers.some(Number.isNaN)) return null
  return { lat: numbers[0], lng: numbers[1] }
}

export function addMessage(draft, { npc }, now = new Date()) {
  // The device stores read message ids, so a reused id would show a new message as already read.
  const message = { id: uniqueId(draft, 'messages', `msg-${npc}-${now.getTime().toString(36)}`), npc, to: 'all', sentAt: draft.campaign.date, text: '' }
  return { ...draft, messages: [...draft.messages, message] }
}

export function messageScheduled(draft, index) {
  const { sentAt } = draft.messages[index]
  return isDate(sentAt) && isDate(draft.campaign.date) && isAfterCampaignDate(sentAt, draft.campaign.date)
}

export function messageOrder(draft) {
  const sortTime = (message) => (isDate(message?.sentAt) ? time(message.sentAt) : Infinity)
  return draft.messages
    .map((message, index) => ({ index, at: sortTime(message) }))
    .sort((a, b) => (a.at === b.at ? a.index - b.index : a.at - b.at))
    .map(({ index }) => index)
}

export function missionPreview(draft, index) {
  const mission = { ...draft.missions[index] }
  mission.hunters = Array.isArray(mission.hunters) ? mission.hunters : []
  const campaign = { campaign: draft.campaign, hunters: draft.hunters }
  return {
    status: missionView(campaign, mission).status,
    scheduled: isDate(mission.postedAt) && isDate(draft.campaign.date) && isScheduled(mission, draft.campaign.date),
  }
}

export function draftErrors(draft) {
  const result = parseCampaign(draft)
  return result.ok ? [] : result.errors
}

export function draftFile(draft, { schemaUrl }) {
  const content = { $schema: schemaUrl, ...draft }
  content.$schema = schemaUrl
  return `${JSON.stringify(content, null, 2)}\n`
}

const DEFAULT_FILE_NAME = 'campanha.json'

export function draftFileName(publishedUrl) {
  if (!publishedUrl) return DEFAULT_FILE_NAME
  const name = decodeURIComponent(new URL(publishedUrl).pathname.split('/').pop())
  return name || DEFAULT_FILE_NAME
}

export function localFileName(name) {
  return name.replace(/ \(\d+\)(?=\.[^.]+$)/, '')
}

export function nextScheduled(draft) {
  const date = draft.campaign.date
  if (!isDate(date)) return null
  const times = [
    ...draft.missions.map(mission => mission?.postedAt),
    ...draft.messages.map(message => message?.sentAt),
  ].filter(iso => isDate(iso) && isAfterCampaignDate(iso, date))
  if (times.length === 0) return null
  return times.reduce((earliest, iso) => (time(iso) < time(earliest) ? iso : earliest))
}

export function advanceToNextScheduled(draft) {
  const next = nextScheduled(draft)
  if (!next) return draft
  const zone = zoneOf(draft.campaign.date)
  return updateCampaign(draft, { date: `${wallTime(time(next), zone)}${zone}` })
}

export function blankDraft(now = new Date()) {
  return draftFrom({ campaign: { name: 'Nova campanha', date: localIso(now) } })
}

export function readDraftText(text) {
  try {
    const raw = JSON.parse(text)
    if (isObject(raw)) return { draft: draftFrom(raw) }
    return { error: 'O arquivo não é um JSON legível de campanha.' }
  } catch (error) {
    return { error: `O arquivo não é um JSON legível: ${error.message}` }
  }
}
