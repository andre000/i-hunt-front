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
