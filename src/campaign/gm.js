import { hunterProfile } from './hunters'
import { isScheduled, missionView } from './missions'
import { isAfterCampaignDate, time } from './time'

const hunterNames = campaign => new Map(campaign.hunters.map(hunter => [hunter.id, hunter.name]))

function missionItem(campaign, mission) {
  const names = hunterNames(campaign)
  return {
    kind: 'mission',
    id: `mission:${mission.id}`,
    at: mission.postedAt ?? null,
    scheduled: isScheduled(mission, campaign.campaign.date),
    mission: missionView(campaign, mission),
    nearNames: mission.nearHunters.map(hunterId => names.get(hunterId)),
  }
}

function messageItem(campaign, message) {
  const names = hunterNames(campaign)
  return {
    kind: 'message',
    id: `message:${message.id}`,
    at: message.sentAt,
    scheduled: isAfterCampaignDate(message.sentAt, campaign.campaign.date),
    message,
    npc: campaign.npcs.find(npc => npc.id === message.npc),
    recipients: message.to === 'all' ? null : message.to.map(hunterId => names.get(hunterId)),
  }
}

function reaches(item, hunterId) {
  if (!hunterId || item.kind === 'mission') return true
  return item.message.to === 'all' || item.message.to.includes(hunterId)
}

function withHunterLink(item, hunterId) {
  if (!hunterId || item.kind !== 'mission') return item
  const { hunters, nearHunters } = item.mission
  const link = hunters.includes(hunterId) ? 'with' : nearHunters.includes(hunterId) ? 'near' : null
  return { ...item, hunterLink: link }
}

const byTime = (a, b) => time(a.at) - time(b.at)

export function gmView(campaign, { hunterId = null } = {}) {
  const date = campaign.campaign.date
  const items = [
    ...campaign.missions.map(mission => missionItem(campaign, mission)),
    ...campaign.messages.map(message => messageItem(campaign, message)),
  ].filter(item => reaches(item, hunterId)).map(item => withHunterLink(item, hunterId))

  const dated = items.filter(item => item.at)
  return {
    date,
    hunters: campaign.hunters.map(hunter => ({
      hunter,
      earnings: hunterProfile(campaign, hunter.id).earnings,
    })),
    npcs: campaign.npcs.map(npc => {
      const messages = campaign.messages.filter(message => message.npc === npc.id)
      return {
        npc,
        sent: messages.filter(message => !isAfterCampaignDate(message.sentAt, date)).length,
        scheduled: messages.filter(message => isAfterCampaignDate(message.sentAt, date)).length,
      }
    }),
    timeline: {
      origin: items.filter(item => !item.at),
      past: dated.filter(item => !item.scheduled).sort(byTime),
      upcoming: dated.filter(item => item.scheduled).sort(byTime),
    },
  }
}
