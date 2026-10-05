import { time } from './time'

const pad = (number) => String(number).padStart(2, '0')

const MINUTE = 60 * 1000

function zoneName(offset) {
  if (offset === 0) return 'Z'
  const sign = offset < 0 ? '-' : '+'
  return `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
}

function zoneOffset(zone) {
  if (zone === 'Z') return 0
  const sign = zone.startsWith('-') ? -1 : 1
  return sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6)))
}

export const isDate = (iso) => typeof iso === 'string' && !Number.isNaN(time(iso))

export function zoneOf(iso) {
  const zone = isDate(iso) && iso.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1]
  return zone || zoneName(-new Date().getTimezoneOffset())
}

export function wallTime(instant, zone) {
  return new Date(instant + zoneOffset(zone) * MINUTE).toISOString().slice(0, 19)
}

export function localIso(date) {
  const zone = zoneName(-date.getTimezoneOffset())
  return `${wallTime(date.getTime(), zone).slice(0, 16)}:00${zone}`
}

export function dateToInput(iso, campaignDate) {
  return isDate(iso) ? wallTime(time(iso), zoneOf(campaignDate)).slice(0, 16) : ''
}

export function dateFromInput(value, campaignDate) {
  return value ? `${value}:00${zoneOf(campaignDate)}` : undefined
}
