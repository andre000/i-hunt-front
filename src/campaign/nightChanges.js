import { visibleMissions } from './missions'
import { messagesFor } from './messages'

const idsOf = (items) => new Set(items.map(item => item.id))

export function nightChanges(before, after, hunterId) {
  const missionsBefore = visibleMissions(before)
  const known = idsOf(missionsBefore)
  const expiredBefore = idsOf(missionsBefore.filter(mission => mission.status === 'expired'))
  const missionsAfter = visibleMissions(after)
  const readBefore = idsOf(messagesFor(before, hunterId))

  return {
    newMissionIds: missionsAfter.filter(mission => !known.has(mission.id)).map(mission => mission.id),
    messages: messagesFor(after, hunterId).filter(message => !readBefore.has(message.id)).length,
    expired: missionsAfter.filter(mission => mission.status === 'expired' && !expiredBefore.has(mission.id)).length,
  }
}

function plural(count, one, many) {
  if (count === 0) return null
  return count === 1 ? one : `${count} ${many}`
}

export function describeChanges({ newMissionIds, messages, expired }) {
  const parts = [
    plural(newMissionIds.length, 'Nova caça no mapa', 'novas caças no mapa'),
    plural(messages, '1 mensagem nova', 'mensagens novas'),
    plural(expired, '1 caça expirou', 'caças expiraram'),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'A noite passou. Nada novo por enquanto.'
}
