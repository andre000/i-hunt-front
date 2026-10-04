import { visibleMissions } from './missions'

export function findHunter(campaign, hunterId) {
  return campaign.hunters.find(hunter => hunter.id === hunterId) ?? null
}

export function hunterProfile(campaign, hunterId) {
  const hunter = findHunter(campaign, hunterId)
  if (!hunter) return null

  const missions = visibleMissions(campaign).filter(mission => mission.hunters.includes(hunterId))
  const completed = missions.filter(mission => mission.status === 'completed')

  return {
    hunter,
    earnings: completed.reduce((total, mission) => total + mission.value / mission.hunters.length, 0),
    inProgress: missions.filter(mission => mission.status === 'in-progress'),
    completed,
  }
}
