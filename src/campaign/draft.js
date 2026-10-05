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
