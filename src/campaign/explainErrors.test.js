import { describe, expect, it } from 'vitest'
import { blankDraft, draftFrom } from './draft'
import { explainErrors } from './explainErrors'
import { validCampaign } from './fixtures'

describe('explainErrors', () => {
  function brokenDraft() {
    const raw = validCampaign()
    raw.campaign.name = ''
    raw.hunters[1].rating = 9
    delete raw.missions[0].value
    raw.messages[1].to = []
    raw.messages[2].npc = 'x'
    return draftFrom(raw)
  }

  it('says which item has the problem and how to open it', () => {
    const errors = explainErrors(brokenDraft())

    expect(errors.map(({ where, target }) => ({ where, target }))).toEqual([
      { where: 'Campanha', target: { section: 'campaign' } },
      { where: 'Hunter “Beto”', target: { section: 'hunters', index: 1 } },
      { where: 'Missão “Lobisomem no Bom Fim”', target: { section: 'missions', index: 0 } },
      { where: 'Mensagem “Ana, venha à igreja.”', target: { section: 'messages', index: 1 } },
      { where: 'Mensagem “Beto, só para você.”', target: { section: 'messages', index: 2 } },
    ])
  })

  it('explains in plain words', () => {
    const messages = explainErrors(brokenDraft()).map(error => error.message)

    expect(messages).toEqual([
      'Nome: não pode ficar vazio.',
      'Avaliação: deve ser <= 5',
      'Falta o valor.',
      'Escolha pelo menos um destinatário.',
      'NPC "x" não existe em /npcs',
    ])
  })

  it('keeps the path for whoever edits the file by hand', () => {
    expect(explainErrors(brokenDraft())[2].path).toBe('/missions/0/value')
  })

  it('asks for a first hunter and opens the new hunter form', () => {
    expect(explainErrors(blankDraft())).toEqual([
      { path: '/hunters', where: 'Hunters', message: 'Adicione pelo menos um hunter.', target: { section: 'hunters', adding: true } },
    ])
  })

  it('cuts a long message text in the place name', () => {
    const raw = validCampaign()
    raw.messages[0].text = 'Uma mensagem bem comprida que passa do limite do nome'
    raw.messages[0].npc = 'x'

    expect(explainErrors(draftFrom(raw))[0].where).toBe('Mensagem “Uma mensagem bem comprida…”')
  })
})
