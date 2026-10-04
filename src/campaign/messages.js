import { isAfterCampaignDate, time } from './time'

function messagesFor(campaign, hunterId) {
  return campaign.messages
    .filter(message => !isAfterCampaignDate(message.sentAt, campaign.campaign.date))
    .filter(message => message.to === 'all' || message.to.includes(hunterId))
    .sort((a, b) => time(a.sentAt) - time(b.sentAt))
}

export function conversation(campaign, hunterId, npcId) {
  const npc = campaign.npcs.find(candidate => candidate.id === npcId)
  const messages = messagesFor(campaign, hunterId).filter(message => message.npc === npcId)
  return npc && messages.length > 0 ? { npc, messages } : null
}

export function inbox(campaign, hunterId, readIds) {
  const read = new Set(readIds)
  return campaign.npcs
    .map(npc => conversation(campaign, hunterId, npc.id))
    .filter(Boolean)
    .map(({ npc, messages }) => ({
      npc,
      lastMessage: messages.at(-1),
      unread: messages.filter(message => !read.has(message.id)).length,
    }))
    .sort((a, b) => time(b.lastMessage.sentAt) - time(a.lastMessage.sentAt))
}

export function unreadTotal(campaign, hunterId, readIds) {
  return inbox(campaign, hunterId, readIds).reduce((total, { unread }) => total + unread, 0)
}
