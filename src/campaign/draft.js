import { parseCampaign } from './parseCampaign'

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

function localIso(date) {
  const offset = -date.getTimezoneOffset()
  const local = new Date(date.getTime() + offset * 60 * 1000)
  const sign = offset < 0 ? '-' : '+'
  const zone = `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  return `${local.toISOString().slice(0, 16)}:00${zone}`
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
