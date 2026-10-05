export const time = (isoDate) => new Date(isoDate).getTime()

export function isAfterCampaignDate(isoDate, campaignDate) {
  return time(isoDate) > time(campaignDate)
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

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function timeLeft(isoDate, campaignDate) {
  const difference = time(isoDate) - time(campaignDate)
  if (difference <= 0) return null

  const days = Math.floor(difference / DAY)
  const hours = Math.floor((difference % DAY) / HOUR)
  const minutes = Math.floor((difference % HOUR) / MINUTE)
  const parts = days > 0
    ? [`${days}d`, hours > 0 && `${hours}h`]
    : [hours > 0 && `${hours}h`, minutes > 0 && `${minutes}min`]
  return parts.filter(Boolean).join(' ')
}

const clockFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function campaignClock(isoDate) {
  const parts = Object.fromEntries(clockFormat.formatToParts(new Date(isoDate)).map(({ type, value }) => [type, value.replace('.', '')]))
  const weekday = parts.weekday.charAt(0).toUpperCase() + parts.weekday.slice(1)
  return { day: `${weekday} ${parts.day} ${parts.month}`, hour: `${parts.hour}:${parts.minute}` }
}
