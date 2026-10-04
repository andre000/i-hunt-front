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
    ['nearHunters', 'hunters'].flatMap(field =>
      (mission[field] ?? [])
        .map((hunterId, index) => ({ hunterId, index }))
        .filter(({ hunterId }) => !hunterIds.has(hunterId))
        .map(({ hunterId, index }) => ({
          path: `/missions/${missionIndex}/${field}/${index}`,
          message: `hunter "${hunterId}" não existe em /hunters`,
        }))
    )
  )
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

export const MISSION_STATUS_LABEL = {
  available: 'Disponível',
  'in-progress': 'Em andamento',
  completed: 'Concluída',
  failed: 'Fracassada',
  expired: 'Expirada',
}

const OPEN_STATUSES = ['available', 'in-progress']

export const RISKS = ['baixo', 'médio', 'alto']

const time = (isoDate) => new Date(isoDate).getTime()

export function missionStatus(mission, campaignDate) {
  if (mission.result === 'concluída') return 'completed'
  if (mission.result === 'fracassada') return 'failed'
  if (mission.hunters.length > 0) return 'in-progress'
  if (mission.deadline && time(mission.deadline) < time(campaignDate)) return 'expired'
  return 'available'
}

export function isScheduled(item, campaignDate) {
  return Boolean(item.postedAt) && time(item.postedAt) > time(campaignDate)
}

function missionView(campaign, mission) {
  return {
    ...mission,
    status: missionStatus(mission, campaign.campaign.date),
    hunterNames: mission.hunters.map(hunterId => findHunter(campaign, hunterId).name),
  }
}

export function visibleMissions(campaign) {
  return campaign.missions
    .filter(mission => !isScheduled(mission, campaign.campaign.date))
    .map(mission => missionView(campaign, mission))
}

export function missionList(campaign, { statuses = [], risks = [] } = {}) {
  return visibleMissions(campaign).filter(mission =>
    (statuses.length === 0 || statuses.includes(mission.status)) &&
    (risks.length === 0 || risks.includes(mission.risk))
  )
}

export function missionDetail(campaign, missionId) {
  return visibleMissions(campaign).find(mission => mission.id === missionId) ?? null
}

export function homeView(campaign, hunterId) {
  const missions = visibleMissions(campaign)
  const open = missions.filter(mission => OPEN_STATUSES.includes(mission.status))
  const featured = open.find(mission => mission.featured) ?? null
  const nearby = open.filter(
    mission => mission !== featured && mission.nearHunters.includes(hunterId)
  )
  const available = missions.filter(mission => mission.status === 'available').length
  return { featured, nearby, available }
}

const UNITS = [
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

const relativeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function relativeToCampaign(isoDate, campaignDate) {
  const difference = time(isoDate) - time(campaignDate)
  const [unit, size] = UNITS.find(([, size]) => Math.abs(difference) >= size) ?? UNITS.at(-1)
  return relativeFormat.format(Math.round(difference / size), unit)
}
