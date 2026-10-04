import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import schema from './campaign.schema.json'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validate = ajv.compile(schema)

function schemaErrors() {
  return validate.errors.map(error => ({
    path: error.params.missingProperty
      ? `${error.instancePath}/${error.params.missingProperty}`
      : error.instancePath,
    message: error.message,
  }))
}

function referenceErrors(raw) {
  const hunterIds = new Set(raw.hunters.map(hunter => hunter.id))
  return raw.missions.flatMap((mission, missionIndex) =>
    (mission.nearHunters ?? [])
      .map((hunterId, index) => ({ hunterId, index }))
      .filter(({ hunterId }) => !hunterIds.has(hunterId))
      .map(({ hunterId, index }) => ({
        path: `/missions/${missionIndex}/nearHunters/${index}`,
        message: `hunter "${hunterId}" não existe em /hunters`,
      }))
  )
}

function normalizeMission(mission) {
  return {
    description: '',
    tags: [],
    featured: false,
    nearHunters: [],
    ...mission,
  }
}

export function parseCampaign(raw) {
  if (!validate(raw)) return { ok: false, errors: schemaErrors() }

  const errors = referenceErrors(raw)
  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    campaign: {
      campaign: { ...raw.campaign },
      hunters: raw.hunters.map(hunter => ({ ...hunter })),
      missions: raw.missions.map(normalizeMission),
    },
  }
}

export function findHunter(campaign, hunterId) {
  return campaign.hunters.find(hunter => hunter.id === hunterId) ?? null
}

export function findMission(campaign, missionId) {
  return campaign.missions.find(mission => mission.id === missionId) ?? null
}

export function homeView(campaign, hunterId) {
  const featured = campaign.missions.find(mission => mission.featured) ?? null
  const nearby = campaign.missions.filter(
    mission => mission !== featured && mission.nearHunters.includes(hunterId)
  )
  return { featured, nearby, total: campaign.missions.length }
}
