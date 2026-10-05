import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import localize from 'ajv-i18n/localize/pt-BR'
import schema from './campaign.schema.json'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validate = ajv.compile(schema)

function schemaErrors() {
  localize(validate.errors)
  return validate.errors.map(error => ({
    path: error.params.missingProperty
      ? `${error.instancePath}/${error.params.missingProperty}`
      : error.instancePath,
    message: error.message,
    kind: error.keyword,
  }))
}

const listOf = (value) => (Array.isArray(value) ? value : [])
const objectsIn = (value) => listOf(value).map((item, index) => ({ item, index })).filter(({ item }) => item && typeof item === 'object')

function unknownHunterErrors(hunterIds, ids, path) {
  return listOf(ids)
    .map((hunterId, index) => ({ hunterId, index }))
    .filter(({ hunterId }) => !hunterIds.has(hunterId))
    .map(({ hunterId, index }) => ({
      path: `${path}/${index}`,
      message: `hunter "${hunterId}" não existe em /hunters`,
      kind: 'reference',
    }))
}

function referenceErrors(raw) {
  if (!raw || typeof raw !== 'object') return []
  const hunterIds = new Set(objectsIn(raw.hunters).map(({ item }) => item.id))
  const npcIds = new Set(objectsIn(raw.npcs).map(({ item }) => item.id))

  const missionErrors = objectsIn(raw.missions).flatMap(({ item: mission, index }) =>
    ['nearHunters', 'hunters'].flatMap(field =>
      unknownHunterErrors(hunterIds, mission[field], `/missions/${index}/${field}`)
    )
  )

  const messageErrors = objectsIn(raw.messages).flatMap(({ item: message, index }) => [
    ...(message.npc === undefined || npcIds.has(message.npc)
      ? []
      : [{ path: `/messages/${index}/npc`, message: `NPC "${message.npc}" não existe em /npcs`, kind: 'reference' }]),
    ...(message.to === 'all' ? [] : unknownHunterErrors(hunterIds, message.to, `/messages/${index}/to`)),
  ])

  return [...missionErrors, ...messageErrors]
}

function normalizeMission(mission) {
  return {
    description: '',
    tags: [],
    featured: false,
    nearHunters: [],
    hunters: [],
    ...mission,
  }
}

export function parseCampaign(raw) {
  const errors = [...(validate(raw) ? [] : schemaErrors()), ...referenceErrors(raw)]
  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    campaign: {
      campaign: { ...raw.campaign },
      hunters: raw.hunters.map(hunter => ({ ...hunter })),
      missions: raw.missions.map(normalizeMission),
      npcs: (raw.npcs ?? []).map(npc => ({ ...npc })),
      messages: (raw.messages ?? []).map(message => ({ ...message })),
    },
  }
}
