import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { gmView } from './gm'
import { isScheduled } from './missions'
import { parseCampaign } from './parseCampaign'
import schema from './campaign.schema.json'

const example = JSON.parse(readFileSync(new URL('../../public/exemplo-campanha.json', import.meta.url), 'utf8'))

function undocumented(node, path = '') {
  if (!node || typeof node !== 'object') return []
  const own = path && !node.description ? [path] : []
  const children = Object.entries(node.properties ?? {}).flatMap(([key, child]) => undocumented(child, `${path}/${key}`))
  const items = node.items ? undocumented(node.items, `${path}/items`) : []
  return [...own, ...children, ...items]
}

describe('example campaign', () => {
  it('is valid against the schema', () => {
    const result = parseCampaign(example)

    expect(result.errors).toBeUndefined()
    expect(result.ok).toBe(true)
  })

  it('has a mission in every status', () => {
    const { timeline } = gmView(parseCampaign(example).campaign)
    const missions = [...timeline.origin, ...timeline.past, ...timeline.upcoming].filter(item => item.kind === 'mission')
    const statuses = new Set(missions.map(item => item.mission.status))

    expect([...statuses].sort()).toEqual(['available', 'completed', 'expired', 'failed', 'in-progress'])
  })

  it('has scheduled missions and messages', () => {
    const date = example.campaign.date

    expect(example.missions.some(mission => isScheduled(mission, date))).toBe(true)
    expect(example.messages.some(message => new Date(message.sentAt) > new Date(date))).toBe(true)
  })

  it('has messages to all hunters and to specific hunters', () => {
    expect(example.messages.some(message => message.to === 'all')).toBe(true)
    expect(example.messages.some(message => Array.isArray(message.to))).toBe(true)
  })

  it('points to the published schema', () => {
    expect(example.$schema).toMatch(/\/campaign\.schema\.json$/)
  })
})

describe('campaign schema', () => {
  it('describes the campaign and every field', () => {
    expect(schema.description).toBeTruthy()
    expect(undocumented(schema)).toEqual([])
  })
})
