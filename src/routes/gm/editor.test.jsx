import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { validCampaign } from '../../campaign/fixtures'

afterEach(() => {
  cleanup()
  setWidth(1280)
})

function setWidth(width) {
  window.innerWidth = width
  window.dispatchEvent(new Event('resize'))
}

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
