import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { validCampaign } from '../../campaign/fixtures'
import { memoryStorage } from '../../test/fakes'

afterEach(() => {
  cleanup()
  setWidth(1280)
})

function setWidth(width) {
  window.innerWidth = width
  window.dispatchEvent(new Event('resize'))
}

describe('Rascunho saved in the browser', () => {
  it('comes back as it was after reloading', async () => {
    const editorStorage = memoryStorage()
    await renderApp({ path: '/gm/editor', hunterId: null, editorStorage })
    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })
    cleanup()

    const body = validCampaign()
    body.campaign.name = 'Mudou no R2'
    await renderApp({ path: '/gm/editor', hunterId: null, editorStorage, body })

    expect((await screen.findByLabelText('Nome da campanha')).value).toBe('Noite em Pelotas')
  })
})

describe('Starting a Rascunho', () => {
  it('starts a blank campaign', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null })

    fireEvent.click(await screen.findByRole('button', { name: 'Começar em branco' }))

    expect(screen.getByLabelText('Nome da campanha').value).toBe('Nova campanha')
    expect(screen.getByText('1 erro')).toBeTruthy()
  })

  it('loads the published campaign from a pasted address', async () => {
    const { saveFile } = await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null })

    fireEvent.change(await screen.findByLabelText('Endereço do arquivo no R2'), { target: { value: 'https://pub-9.r2.dev/noites.json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Carregar' }))

    expect((await screen.findByLabelText('Nome da campanha')).value).toBe('Noite em Porto Alegre')
    fireEvent.click(screen.getByRole('button', { name: 'Baixar' }))
    expect(saveFile.mock.calls[0][0]).toBe('noites.json')
  })

  it('explains when the pasted address is not readable JSON', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null, body: '<html>' })

    fireEvent.change(await screen.findByLabelText('Endereço do arquivo no R2'), { target: { value: 'https://pub-9.r2.dev/noites.json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Carregar' }))

    expect(await screen.findByText(/JSON inválido/)).toBeTruthy()
  })

  it('opens a campaign file from the computer', async () => {
    const { saveFile } = await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null })
    const file = new File([JSON.stringify(validCampaign())], 'mesa.json', { type: 'application/json' })

    fireEvent.change(await screen.findByLabelText('Abrir arquivo do computador'), { target: { files: [file] } })

    expect((await screen.findByLabelText('Nome da campanha')).value).toBe('Noite em Porto Alegre')
    fireEvent.click(screen.getByRole('button', { name: 'Baixar' }))
    expect(saveFile.mock.calls[0][0]).toBe('mesa.json')
  })

  it('explains when the file from the computer is not readable JSON', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null })
    const file = new File(['não é json'], 'notas.txt')

    fireEvent.change(await screen.findByLabelText('Abrir arquivo do computador'), { target: { files: [file] } })

    expect(await screen.findByText(/O arquivo não é um JSON legível/)).toBeTruthy()
    expect(screen.queryByLabelText('Nome da campanha')).toBeNull()
  })
})

describe('Replacing the Rascunho', () => {
  async function renameAndChooseBlank() {
    const result = await renderApp({ path: '/gm/editor', hunterId: null })
    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Trocar rascunho' }))
    fireEvent.click(screen.getByRole('button', { name: 'Começar em branco' }))
    return result
  }

  it('asks before replacing the open draft', async () => {
    await renameAndChooseBlank()

    const dialog = screen.getByRole('alertdialog', { name: 'Substituir o rascunho atual?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Substituir' }))

    expect(screen.getByLabelText('Nome da campanha').value).toBe('Nova campanha')
  })

  it('keeps the draft when the GM cancels', async () => {
    await renameAndChooseBlank()

    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao rascunho' }))

    expect(screen.getByLabelText('Nome da campanha').value).toBe('Noite em Pelotas')
  })

  it('discards the draft after confirming', async () => {
    const { editorStorage } = await renderApp({ path: '/gm/editor', hunterId: null })
    await screen.findByLabelText('Nome da campanha')

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Descartar o rascunho atual?' })).getByRole('button', { name: 'Descartar' }))

    expect(screen.queryByLabelText('Nome da campanha')).toBeNull()
    expect(screen.getByRole('button', { name: 'Começar em branco' })).toBeTruthy()
    expect(editorStorage.keys()).not.toContain('ihunt.editor.draft')
  })
})

describe('Mudanças não baixadas', () => {
  it('is not shown for a draft just loaded', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null })
    await screen.findByLabelText('Nome da campanha')

    expect(screen.queryByText('Mudanças não baixadas')).toBeNull()
  })

  it('shows after a change, survives a reload and goes away after downloading', async () => {
    const editorStorage = memoryStorage()
    await renderApp({ path: '/gm/editor', hunterId: null, editorStorage })
    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })
    expect(screen.getByText('Mudanças não baixadas')).toBeTruthy()
    cleanup()

    await renderApp({ path: '/gm/editor', hunterId: null, editorStorage })
    expect(await screen.findByText('Mudanças não baixadas')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Baixar' }))
    await waitFor(() => expect(screen.queryByText('Mudanças não baixadas')).toBeNull())
  })
})

describe('Data da campanha', () => {
  it('is edited without a time zone and kept with the zone of the campaign', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    const field = await screen.findByLabelText('Data da campanha')
    expect(field.value).toBe('2026-10-04T21:00')
    fireEvent.change(field, { target: { value: '2026-10-05T02:15' } })

    expect(store.getState().editor.draft.campaign.date).toBe('2026-10-05T02:15:00-03:00')
  })

  it('advances to the next scheduled message', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.click(await screen.findByRole('button', { name: 'Avançar até o próximo agendado' }))

    expect(screen.getByLabelText('Data da campanha').value).toBe('2026-10-04T23:00')
    expect(store.getState().editor.draft.campaign.date).toBe('2026-10-04T23:00:00-03:00')
    expect(screen.getByText('Mudanças não baixadas')).toBeTruthy()
  })

  it('cannot advance when nothing is scheduled', async () => {
    const body = validCampaign()
    body.messages = body.messages.filter(message => message.id !== 'msg5')
    await renderApp({ path: '/gm/editor', hunterId: null, body })

    expect((await screen.findByRole('button', { name: 'Avançar até o próximo agendado' })).disabled).toBe(true)
  })
})

describe('Hunters', () => {
  async function openHunter(name, options = {}) {
    const result = await renderApp({ path: '/gm/editor', hunterId: null, ...options })
    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    fireEvent.click(within(sections).getByRole('button', { name }))
    return result
  }

  it('adds a hunter with an id made from the name', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar hunter' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João da Silva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    const sections = screen.getByRole('navigation', { name: 'Seções do rascunho' })
    expect(within(sections).getByRole('button', { name: 'João da Silva' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByText('joao-da-silva')).toBeTruthy()
    expect(store.getState().editor.draft.hunters.at(-1)).toEqual({ id: 'joao-da-silva', name: 'João da Silva' })
  })

  it('renames a hunter without changing the id', async () => {
    const { store } = await openHunter('Ana')

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Souza' } })

    expect(within(screen.getByRole('navigation', { name: 'Seções do rascunho' })).getByRole('button', { name: 'Ana Souza' })).toBeTruthy()
    expect(store.getState().editor.draft.hunters[0]).toMatchObject({ id: 'ana', name: 'Ana Souza' })
  })

  it('edits the avatar with a preview and the rating', async () => {
    const { store } = await openHunter('Beto')

    fireEvent.change(screen.getByLabelText('Avatar (endereço da imagem)'), { target: { value: 'https://example.com/beto.png' } })
    fireEvent.change(screen.getByLabelText('Avaliação (0 a 5)'), { target: { value: '3.5' } })

    expect(screen.getByRole('img', { name: 'Prévia do avatar' }).querySelector('img').getAttribute('src')).toBe('https://example.com/beto.png')
    expect(store.getState().editor.draft.hunters[1]).toEqual({ id: 'beto', name: 'Beto', avatar: 'https://example.com/beto.png', rating: 3.5 })
  })

  it('reports a rating above 5', async () => {
    await openHunter('Beto')

    fireEvent.change(screen.getByLabelText('Avaliação (0 a 5)'), { target: { value: '7' } })

    expect(screen.getByText('/hunters/1/rating')).toBeTruthy()
  })

  it('shows where the hunter appears before deleting', async () => {
    await openHunter('Ana')

    fireEvent.click(screen.getByRole('button', { name: 'Apagar hunter' }))

    const dialog = screen.getByRole('alertdialog', { name: 'Apagar Ana?' })
    expect(within(dialog).getByText('Lobisomem no Bom Fim')).toBeTruthy()
    expect(within(dialog).getByText('Fantasma no ônibus T5')).toBeTruthy()
    expect(within(dialog).getByText('Ana, venha à igreja.')).toBeTruthy()
    expect(within(dialog).getByText(/ficariam sem destinatário/)).toBeTruthy()
  })

  it('takes the hunter out of the whole draft after confirming', async () => {
    const { store } = await openHunter('Ana')

    fireEvent.click(screen.getByRole('button', { name: 'Apagar hunter' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Apagar' }))

    const { draft } = store.getState().editor
    expect(draft.hunters.map(hunter => hunter.id)).toEqual(['beto'])
    expect(draft.missions[1].nearHunters).toEqual(['beto'])
    expect(within(screen.getByRole('navigation', { name: 'Seções do rascunho' })).queryByRole('button', { name: 'Ana' })).toBeNull()
    expect(screen.getAllByText('/messages/1/to').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 1, name: 'Campanha' })).toBeTruthy()
  })
})

describe('NPCs', () => {
  async function openNpc(name) {
    const result = await renderApp({ path: '/gm/editor', hunterId: null })
    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    fireEvent.click(within(sections).getByRole('button', { name }))
    return result
  }

  it('adds a NPC with an id made from the name', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar NPC' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Seu Lúcio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(store.getState().editor.draft.npcs.at(-1)).toEqual({ id: 'seu-lucio', name: 'Seu Lúcio' })
    expect(screen.getByRole('heading', { level: 1, name: 'Seu Lúcio' })).toBeTruthy()
  })

  it('edits the name and the avatar with a preview, keeping the id', async () => {
    const { store } = await openNpc('Dona Rosa')

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Dona Rosa Maria' } })
    fireEvent.change(screen.getByLabelText('Avatar (endereço da imagem)'), { target: { value: 'https://example.com/rosa.png' } })

    expect(screen.getByRole('img', { name: 'Prévia do avatar' }).querySelector('img').getAttribute('src')).toBe('https://example.com/rosa.png')
    expect(store.getState().editor.draft.npcs[0]).toEqual({ id: 'dona-rosa', name: 'Dona Rosa Maria', avatar: 'https://example.com/rosa.png' })
  })

  it('refuses to delete a NPC with messages and says how many', async () => {
    const { store } = await openNpc('Padre Júlio')

    fireEvent.click(screen.getByRole('button', { name: 'Apagar NPC' }))

    expect(screen.getByRole('alert').textContent).toMatch(/Padre Júlio tem 2 mensagens/)
    expect(store.getState().editor.draft.npcs).toHaveLength(2)
  })

  it('deletes a NPC without messages after confirming', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })
    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar NPC' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vizinha' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    fireEvent.click(screen.getByRole('button', { name: 'Apagar NPC' }))
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Apagar Vizinha?' })).getByRole('button', { name: 'Apagar' }))

    expect(store.getState().editor.draft.npcs.map(npc => npc.id)).toEqual(['dona-rosa', 'padre'])
    expect(screen.getByRole('heading', { level: 1, name: 'Campanha' })).toBeTruthy()
  })
})

describe('Missões', () => {
  async function openMission(name, options = {}) {
    const result = await renderApp({ path: '/gm/editor', hunterId: null, ...options })
    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    fireEvent.click(within(sections).getByRole('button', { name }))
    return result
  }

  const missionInDraft = (store, index) => store.getState().editor.draft.missions[index]

  it('adds a mission with name, location, value and risk', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar missão' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Mula sem cabeça' } })
    fireEvent.change(screen.getByLabelText('Local'), { target: { value: 'Menino Deus' } })
    fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '350' } })
    fireEvent.change(screen.getByLabelText('Risco'), { target: { value: 'alto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(missionInDraft(store, 3)).toEqual({ id: 'mula-sem-cabeca', name: 'Mula sem cabeça', location: 'Menino Deus', value: 350, risk: 'alto' })
    expect(screen.getByText('Disponível', { selector: '.editor__meta *' })).toBeTruthy()
  })

  it('edits the optional fields, with dates without a time zone', async () => {
    const { store } = await openMission('Vampiro no bar')

    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Ele morde.' } })
    fireEvent.change(screen.getByLabelText('Etiquetas (separadas por vírgula)'), { target: { value: 'vampiro, noite' } })
    fireEvent.click(screen.getByLabelText('Em destaque'))
    fireEvent.change(screen.getByLabelText('Prazo'), { target: { value: '2026-10-06T23:00' } })
    fireEvent.change(screen.getByLabelText('Publicação'), { target: { value: '2026-10-04T20:00' } })

    expect(missionInDraft(store, 2)).toMatchObject({
      description: 'Ele morde.',
      tags: ['vampiro', 'noite'],
      featured: true,
      deadline: '2026-10-06T23:00:00-03:00',
      postedAt: '2026-10-04T20:00:00-03:00',
    })
    expect(screen.getByLabelText('Etiquetas (separadas por vírgula)').value).toBe('vampiro, noite')
  })

  it('picks hunters and "perto" from the hunters of the campaign', async () => {
    const { store } = await openMission('Vampiro no bar')

    fireEvent.click(within(screen.getByRole('group', { name: 'Hunters na missão' })).getByLabelText('Beto'))
    fireEvent.click(within(screen.getByRole('group', { name: 'Aparece como perto para' })).getByLabelText('Ana'))

    expect(missionInDraft(store, 2)).toMatchObject({ hunters: ['beto'], nearHunters: ['ana'] })
    expect(screen.getByText('Em andamento', { selector: '.editor__meta *' })).toBeTruthy()
  })

  it('sets and clears the result', async () => {
    const { store } = await openMission('Vampiro no bar')

    fireEvent.change(screen.getByLabelText('Resultado'), { target: { value: 'concluída' } })
    expect(missionInDraft(store, 2).result).toBe('concluída')
    expect(screen.getByText('Concluída', { selector: '.editor__meta *' })).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Resultado'), { target: { value: '' } })
    expect(missionInDraft(store, 2)).not.toHaveProperty('result')
  })

  it('shows Agendado in the form and the list until the date passes', async () => {
    await openMission('Vampiro no bar')

    fireEvent.change(screen.getByLabelText('Publicação'), { target: { value: '2026-10-04T22:00' } })

    const missions = screen.getByRole('list', { name: 'Missões' })
    expect(within(missions).getByText('Agendado')).toBeTruthy()
    expect(screen.getByText('Agendado', { selector: '.editor__meta *' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Avançar até o próximo agendado' }))

    expect(within(missions).queryByText('Agendado')).toBeNull()
    expect(screen.queryByText('Agendado', { selector: '.editor__meta *' })).toBeNull()
  })

  it('sets the position by typing latitude and longitude', async () => {
    const { store } = await openMission('Vampiro no bar')

    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-30.04' } })
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-51.22' } })

    expect(missionInDraft(store, 2).position).toEqual({ lat: -30.04, lng: -51.22 })
  })

  it('fills both fields when "lat, lng" is pasted', async () => {
    const { store } = await openMission('Vampiro no bar')

    fireEvent.paste(screen.getByLabelText('Latitude'), { clipboardData: { getData: () => '-30.0346, -51.2177' } })

    expect(missionInDraft(store, 2).position).toEqual({ lat: -30.0346, lng: -51.2177 })
    expect(screen.getByLabelText('Longitude').value).toBe('-51.2177')
  })

  it('removes the position', async () => {
    const body = validCampaign()
    body.missions[2].position = { lat: -30.04, lng: -51.22 }
    const { store } = await openMission('Vampiro no bar', { body })

    fireEvent.click(screen.getByRole('button', { name: 'Tirar posição' }))

    expect(missionInDraft(store, 2)).not.toHaveProperty('position')
    expect(screen.getByLabelText('Latitude').value).toBe('')
  })

  it('deletes a mission after confirming', async () => {
    const { store } = await openMission('Fantasma no ônibus T5')

    fireEvent.click(screen.getByRole('button', { name: 'Apagar missão' }))
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Apagar Fantasma no ônibus T5?' })).getByRole('button', { name: 'Apagar' }))

    expect(store.getState().editor.draft.missions.map(mission => mission.id)).toEqual(['m1', 'm3'])
  })
})

describe('Mensagens', () => {
  const messages = (store) => store.getState().editor.draft.messages

  async function openMessage(text, options = {}) {
    const result = await renderApp({ path: '/gm/editor', hunterId: null, ...options })
    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    fireEvent.click(within(sections).getByRole('button', { name: text }))
    return result
  }

  it('writes a message from a NPC chosen in a list, at the campaign date', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar mensagem' }))
    fireEvent.change(screen.getByLabelText('NPC'), { target: { value: 'padre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Venham todos.' } })

    expect(messages(store).at(-1)).toEqual({ id: expect.stringMatching(/^msg-padre-/), npc: 'padre', to: 'all', sentAt: '2026-10-04T21:00:00-03:00', text: 'Venham todos.' })
    expect(screen.getByLabelText('Hora').value).toBe('2026-10-04T21:00')
    expect(screen.queryByText('Agendado', { selector: '.editor__meta *' })).toBeNull()
  })

  it('changes the NPC and sends to specific hunters', async () => {
    const { store } = await openMessage('Tem algo no parque.')

    fireEvent.change(screen.getByLabelText('NPC'), { target: { value: 'padre' } })
    fireEvent.click(screen.getByLabelText('Hunters específicos'))
    fireEvent.click(within(screen.getByRole('group', { name: 'Para' })).getByLabelText('Beto'))

    expect(messages(store)[0]).toMatchObject({ npc: 'padre', to: ['beto'] })

    fireEvent.click(screen.getByLabelText('Todos os hunters'))
    expect(messages(store)[0].to).toBe('all')
  })

  it('shows Agendado for a time after the campaign date', async () => {
    await openMessage('Tem algo no parque.')

    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '2026-10-04T22:00' } })

    expect(screen.getByText('Agendado', { selector: '.editor__meta *' })).toBeTruthy()
    const sections = screen.getByRole('navigation', { name: 'Seções do rascunho' })
    expect(within(sections).getAllByText('Agendado')).toHaveLength(2)
  })

  it('lists the messages in time order', async () => {
    const body = validCampaign()
    body.messages[0].sentAt = '2026-10-04T19:45:00-03:00'
    await renderApp({ path: '/gm/editor', hunterId: null, body })

    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    const list = within(sections).getByRole('list', { name: 'Mensagens' })
    expect(within(list).getAllByRole('button').map(button => button.textContent)).toEqual([
      'Ana, venha à igreja.', 'Beto, só para você.', 'Tem algo no parque.', 'Ana, cuidado.', 'Ainda não.',
    ])
  })

  it('deletes a message after confirming', async () => {
    const { store } = await openMessage('Beto, só para você.')

    fireEvent.click(screen.getByRole('button', { name: 'Apagar mensagem' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Apagar' }))

    expect(messages(store).map(message => message.id)).toEqual(['msg1', 'msg2', 'msg4', 'msg5'])
  })
})

describe('Erros do rascunho', () => {
  it('opens the item that has the problem when the error is clicked', async () => {
    const body = validCampaign()
    body.missions[2].value = 'cem'
    body.messages[3].npc = 'ninguem'
    body.hunters[1].rating = 9
    await renderApp({ path: '/gm/editor', hunterId: null, body })

    const errors = await screen.findByRole('region', { name: 'Erros do rascunho' })
    fireEvent.click(within(errors).getByRole('button', { name: /Missão “Vampiro no bar”/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Vampiro no bar' })).toBeTruthy()

    fireEvent.click(within(errors).getByRole('button', { name: /Hunter “Beto”/ }))
    expect(screen.getByLabelText('Avaliação (0 a 5)').value).toBe('9')

    fireEvent.click(within(errors).getByRole('button', { name: /Mensagem “Ana, cuidado.”/ }))
    expect(screen.getByLabelText('Texto').value).toBe('Ana, cuidado.')
  })

  it('opens the new hunter form when the campaign has no hunter', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: null })
    fireEvent.click(await screen.findByRole('button', { name: 'Começar em branco' }))

    fireEvent.click(screen.getByRole('button', { name: /Adicione pelo menos um hunter/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Novo hunter' })).toBeTruthy()
  })
})

describe('Editor da campanha', () => {
  it('opens the published campaign of the device as the draft', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null })

    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    expect(within(sections).getByRole('button', { name: 'Campanha' })).toBeTruthy()
    expect(within(sections).getByRole('button', { name: 'Ana' })).toBeTruthy()
    expect(within(sections).getByRole('button', { name: 'Vampiro no bar' })).toBeTruthy()
    expect(within(sections).getByRole('button', { name: 'Padre Júlio' })).toBeTruthy()
    expect(screen.getByLabelText('Nome da campanha').value).toBe('Noite em Porto Alegre')
  })

  it('edits the name of the campaign in the draft', async () => {
    const { store } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })

    expect(screen.getByLabelText('Nome da campanha').value).toBe('Noite em Pelotas')
    expect(store.getState().editor.draft.campaign.name).toBe('Noite em Pelotas')
  })

  it('opens the chosen item on the right', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null })

    const sections = await screen.findByRole('navigation', { name: 'Seções do rascunho' })
    fireEvent.click(within(sections).getByRole('button', { name: 'Vampiro no bar' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Vampiro no bar' })).toBeTruthy()
    expect(screen.queryByLabelText('Nome da campanha')).toBeNull()
  })

  it('shows the count and the list of errors of a published campaign with errors', async () => {
    const body = validCampaign()
    body.missions[0].value = 'cem'
    await renderApp({ path: '/gm/editor', hunterId: null, body })

    expect(await screen.findByText('1 erro')).toBeTruthy()
    expect(screen.getByText('/missions/0/value')).toBeTruthy()
  })

  it('shows no errors for a valid draft', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null })

    expect(await screen.findByText('Sem erros')).toBeTruthy()
  })

  it('counts a new error as soon as the draft changes', async () => {
    await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: '' } })

    expect(screen.getByText('1 erro')).toBeTruthy()
    expect(screen.getByText('/campaign/name')).toBeTruthy()
  })

  it('asks to open on a computer on a narrow screen', async () => {
    setWidth(390)
    await renderApp({ path: '/gm/editor', hunterId: null })

    expect(await screen.findByText('Abra no computador para editar')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Seções do rascunho' })).toBeNull()
  })

  it('shows the editor when the screen grows', async () => {
    setWidth(390)
    await renderApp({ path: '/gm/editor', hunterId: null })
    await screen.findByText('Abra no computador para editar')

    act(() => setWidth(1280))

    expect(await screen.findByRole('navigation', { name: 'Seções do rascunho' })).toBeTruthy()
  })

  it('is reached from the Editar button of the Visão do GM', async () => {
    const { router } = await renderApp({ path: '/gm', hunterId: null })

    fireEvent.click(await screen.findByRole('link', { name: 'Editar' }))

    expect(await screen.findByRole('navigation', { name: 'Seções do rascunho' })).toBeTruthy()
    expect(router.state.location.pathname).toBe('/gm/editor')
  })

  it('keeps the Visão do GM without the Editar button on a phone', async () => {
    setWidth(390)
    await renderApp({ path: '/gm', hunterId: null })

    expect(await screen.findByText('Noite em Porto Alegre')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Editar' })).toBeNull()
  })

  it('downloads the draft with the name of the published file', async () => {
    const { saveFile } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: 'Noite em Pelotas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Baixar' }))

    expect(saveFile).toHaveBeenCalledTimes(1)
    const [name, text] = saveFile.mock.calls[0]
    expect(name).toBe('campanha.json')
    expect(JSON.parse(text).$schema).toBe(`${window.location.origin}/campaign.schema.json`)
    expect(JSON.parse(text).campaign.name).toBe('Noite em Pelotas')
  })

  it('locks Baixar while the draft has errors', async () => {
    const { saveFile } = await renderApp({ path: '/gm/editor', hunterId: null })

    fireEvent.change(await screen.findByLabelText('Nome da campanha'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Baixar' }))

    expect(screen.getByRole('button', { name: 'Baixar' }).disabled).toBe(true)
    expect(saveFile).not.toHaveBeenCalled()
  })

  it('keeps the name of a published file with another name', async () => {
    const { saveFile } = await renderApp({ path: '/gm/editor', hunterId: null, campaignUrl: 'https://pub-123.r2.dev/mesas/noites.json' })

    fireEvent.click(await screen.findByRole('button', { name: 'Baixar' }))

    expect(saveFile.mock.calls[0][0]).toBe('noites.json')
  })
})
