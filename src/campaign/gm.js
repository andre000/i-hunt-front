import { hunterProfile } from './hunters'
import { isScheduled, missionView } from './missions'

export function gmView(campaign) {
  const date = campaign.campaign.date
  return {
    date,
    hunters: campaign.hunters.map(hunter => ({
      hunter,
      earnings: hunterProfile(campaign, hunter.id).earnings,
    })),
    missions: campaign.missions.map(mission => ({
      ...missionView(campaign, mission),
      scheduled: isScheduled(mission, date),
    })),
  }
}
