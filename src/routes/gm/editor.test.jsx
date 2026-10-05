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
