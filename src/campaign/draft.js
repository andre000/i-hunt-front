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
