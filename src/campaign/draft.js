import { parseCampaign } from './parseCampaign'
import { isAfterCampaignDate, time } from './time'

const SECTIONS = ['hunters', 'missions', 'npcs', 'messages']

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function draftFrom(raw) {
  const source = isObject(raw) ? raw : {}
  const draft = structuredClone(source)
  draft.campaign = isObject(source.campaign) ? draft.campaign : {}
  for (const section of SECTIONS) {
    if (!Array.isArray(source[section])) draft[section] = []
  }
  return draft
}

export function updateCampaign(draft, changes) {
  return { ...draft, campaign: { ...draft.campaign, ...changes } }
}

const FALLBACK_IDS = { hunters: 'hunter', missions: 'missao', npcs: 'npc', messages: 'mensagem' }

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
  const base = slug(name) || FALLBACK_IDS[section]
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
  return { ...draft, hunters: draft.hunters.filter((_, at) => at !== index), missions, messages }
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
  const name = new URL(publishedUrl).pathname.split('/').pop()
  return name || DEFAULT_FILE_NAME
}

const pad = (number) => String(number).padStart(2, '0')

const MINUTE = 60 * 1000

function zoneName(offset) {
  if (offset === 0) return 'Z'
  const sign = offset < 0 ? '-' : '+'
  return `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
}

function zoneOffset(zone) {
  if (zone === 'Z') return 0
  const sign = zone.startsWith('-') ? -1 : 1
  return sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6)))
}

const isDate = (iso) => typeof iso === 'string' && !Number.isNaN(time(iso))

function zoneOf(iso) {
  const zone = isDate(iso) && iso.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1]
  return zone || zoneName(-new Date().getTimezoneOffset())
}

function wallTime(instant, zone) {
  return new Date(instant + zoneOffset(zone) * MINUTE).toISOString().slice(0, 19)
}

function localIso(date) {
  const zone = zoneName(-date.getTimezoneOffset())
  return `${wallTime(date.getTime(), zone).slice(0, 16)}:00${zone}`
}

export function dateToInput(iso, campaignDate) {
  return isDate(iso) ? wallTime(time(iso), zoneOf(campaignDate)).slice(0, 16) : ''
}

export function dateFromInput(value, campaignDate) {
  return value ? `${value}:00${zoneOf(campaignDate)}` : undefined
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
