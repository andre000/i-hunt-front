import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { describeChanges, nightChanges } from './nightChanges'
import { parseCampaign } from './parseCampaign'
import { shiftDate } from './demoSync'

const example = parseCampaign(JSON.parse(readFileSync(new URL('../../public/exemplo-campanha.json', import.meta.url), 'utf8'))).campaign

function at(hours) {
  return { ...example, campaign: { ...example.campaign, date: shiftDate(example.campaign.date, hours) } }
}

describe('nightChanges', () => {
  it('finds the hunt and the message released on the second night', () => {
    expect(nightChanges(at(0), at(24), 'ana')).toEqual({ newMissionIds: ['culto-guaiba'], messages: 1, expired: 0 })
  })

  it('finds the hunt that expired on the third night', () => {
    expect(nightChanges(at(24), at(60), 'ana')).toEqual({ newMissionIds: [], messages: 0, expired: 1 })
  })

  it('counts only messages sent to everyone when no hunter was chosen', () => {
    expect(nightChanges(at(0), at(24), null).messages).toBe(1)
  })
})

describe('describeChanges', () => {
  it.each([
    [{ newMissionIds: ['a'], messages: 1, expired: 0 }, 'Nova caça no mapa · 1 mensagem nova'],
    [{ newMissionIds: ['a', 'b'], messages: 2, expired: 2 }, '2 novas caças no mapa · 2 mensagens novas · 2 caças expiraram'],
    [{ newMissionIds: [], messages: 0, expired: 1 }, '1 caça expirou'],
    [{ newMissionIds: [], messages: 0, expired: 0 }, 'A noite passou. Nada novo por enquanto.'],
  ])('describes %o', (changes, text) => {
    expect(describeChanges(changes)).toBe(text)
  })
})
