import { isAfterCampaignDate, time } from './time'

export const MISSION_STATUS_LABEL = {
  available: 'Disponível',
  'in-progress': 'Em andamento',
  completed: 'Concluída',
  failed: 'Fracassada',
  expired: 'Expirada',
}

const OPEN_STATUSES = ['available', 'in-progress']

export const RISKS = ['baixo', 'médio', 'alto']

function missionStatus(mission, campaignDate) {
  if (mission.result === 'concluída') return 'completed'
  if (mission.result === 'fracassada') return 'failed'
  if (mission.hunters.length > 0) return 'in-progress'
  if (mission.deadline && time(mission.deadline) < time(campaignDate)) return 'expired'
  return 'available'
}

export function isScheduled(item, campaignDate) {
  return Boolean(item.postedAt) && isAfterCampaignDate(item.postedAt, campaignDate)
}

export function missionView(campaign, mission) {
  const names = new Map(campaign.hunters.map(hunter => [hunter.id, hunter.name]))
  return {
    ...mission,
    status: missionStatus(mission, campaign.campaign.date),
    hunterNames: mission.hunters.map(hunterId => names.get(hunterId)),
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
