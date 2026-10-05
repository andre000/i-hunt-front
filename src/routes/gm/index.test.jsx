import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { parsed, validCampaign } from '../../campaign/fixtures'
import { campaignLoaded } from '../../store/campaign'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

function campaignWithHistory() {
  const body = validCampaign()
  body.missions[0].hunters = ['ana']
  body.missions[0].result = 'concluída'
  body.missions.push({ id: 'later', name: 'Caça futura', location: 'Centro', value: 10, risk: 'baixo', postedAt: '2026-10-05T09:00:00-03:00' })
  return body
}

describe('GM view', () => {
  it('shows the campaign, its hunters and NPCs', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    expect(await screen.findByText('Noite em Porto Alegre')).toBeTruthy()
    expect(screen.getByLabelText(/^Data da campanha:/)).toBeTruthy()
    expect(screen.getByText('4.5')).toBeTruthy()
    expect(screen.getByText('sem nota')).toBeTruthy()
    expect(screen.getByText('3 enviadas')).toBeTruthy()
    expect(screen.getByText('1 enviada · 1 agendada')).toBeTruthy()
  })

  it('puts missions and messages on one timeline, with the scheduled ones after Agora', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    const timeline = await screen.findByRole('region', { name: 'Linha do tempo' })
    fireEvent.click(within(timeline).getByText('Mostrar 1 anterior'))
    const text = timeline.textContent
    expect(within(timeline).getByText('Concluída')).toBeTruthy()
    expect(within(timeline).getByText('com Ana')).toBeTruthy()
    expect(text.indexOf('Tem algo no parque.')).toBeLessThan(text.indexOf('Agora'))
    expect(text.indexOf('Agora')).toBeLessThan(text.indexOf('Ainda não.'))
    expect(within(timeline).getByText('em 12h')).toBeTruthy()
  })

  it('names the next scheduled item at Agora and opens it', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    const next = await screen.findByRole('button', { name: /Próximo em 2h/ })
    expect(within(next).getByText('Padre Júlio → Todos')).toBeTruthy()
    fireEvent.click(next)
    expect(screen.getByText('Ainda não.').closest('button').getAttribute('aria-expanded')).toBe('true')
  })

  it('tells what just came out when the campaign date moves', async () => {
    const { store } = await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })
    expect(await screen.findByText('Noite em Porto Alegre')).toBeTruthy()

    const later = campaignWithHistory()
    later.campaign.date = '2026-10-05T10:00:00-03:00'
    act(() => {
      store.dispatch(campaignLoaded({ status: 'ready', campaign: parsed(later) }))
    })

    expect(await screen.findByText('Acabou de sair: 1 missão e 1 mensagem.')).toBeTruthy()
    expect(screen.getAllByText('Saiu agora')).toHaveLength(2)
  })

  it('tells what came out since the last visit to the GM view', async () => {
    window.localStorage.setItem('ihunt.gm.seenDate:https://pub-123.r2.dev/campanha.json', '2026-10-04T18:30:00-03:00')
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    expect(await screen.findByText('Acabou de sair: 3 mensagens.')).toBeTruthy()
    expect(window.localStorage.getItem('ihunt.gm.seenDate:https://pub-123.r2.dev/campanha.json')).toBe('2026-10-04T21:00:00-03:00')
  })

  it('rehearses a later date without changing the campaign', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    const slider = await screen.findByLabelText('Ensaiar a data da campanha')
    expect(slider.max).toBe('720')
    fireEvent.change(slider, { target: { value: '90' } })
    expect(screen.queryByText('Ensaio')).toBeTruthy()
    expect(screen.queryByText('Vai sair')).toBeNull()

    fireEvent.change(slider, { target: { value: '150' } })
    expect(screen.getByText(/Os jogadores ainda não veem isto/)).toBeTruthy()
    expect(screen.getByText('Até aqui, saem: 1 mensagem.')).toBeTruthy()
    expect(screen.getByText('Vai sair')).toBeTruthy()
    const text = screen.getByRole('region', { name: 'Linha do tempo' }).textContent
    expect(text.indexOf('Ainda não.')).toBeLessThan(text.indexOf('Ensaio'))

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para agora' }))
    expect(screen.queryByText('Ensaio')).toBeNull()
    expect(screen.getByLabelText(/^Data da campanha:/).getAttribute('datetime')).toBe('2026-10-04T21:00:00-03:00')
  })

  it('jumps between scheduled times with the arrow keys', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    const slider = await screen.findByLabelText('Ensaiar a data da campanha')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider.value).toBe('120')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider.value).toBe('720')
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    expect(slider.value).toBe('120')
  })

  it('opens an item to show all of it', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    fireEvent.click(await screen.findByText('Mostrar 1 anterior'))
    expect(screen.queryByText('Algo anda atacando cachorros no parque.')).toBeNull()
    fireEvent.click(screen.getByText('Lobisomem no Bom Fim').closest('button'))

    expect(screen.getByText('Algo anda atacando cachorros no parque.')).toBeTruthy()
    expect(screen.getByText('Risco alto')).toBeTruthy()
  })

  it('shows what one hunter sees, marking the missions near them', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: campaignWithHistory() })

    fireEvent.click(await screen.findByRole('button', { name: /Beto.*sem nota/ }))

    expect(screen.getByText('O que chega para Beto')).toBeTruthy()
    expect(screen.getByText('Beto, só para você.')).toBeTruthy()
    expect(screen.queryByText('Ana, venha à igreja.')).toBeNull()
    expect(screen.getByText('Vampiro no bar')).toBeTruthy()
    expect(screen.getByText('perto de Beto')).toBeTruthy()

    fireEvent.click(screen.getByText('Ver todos'))
    expect(screen.getByText('Ana, venha à igreja.')).toBeTruthy()
  })

  it('shows the Convite of the campaign', async () => {
    await renderApp({ path: '/gm', hunterId: null })

    const invite = await screen.findByLabelText('Convite da campanha')
    expect(invite.value).toContain('?campanha=https%3A%2F%2Fpub-123.r2.dev%2Fcampanha.json')
    expect(screen.getByText('campanha.json')).toBeTruthy()
  })

  it('asks for the campaign link when none is open', async () => {
    await renderApp({ path: '/gm', hunterId: null, campaignUrl: null })

    expect(await screen.findByText('Abra sua campanha')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Link da campanha'), { target: { value: 'campanha' } })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByText(/Isso não parece um link/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Abrir a campanha de exemplo' })).toBeTruthy()
    expect(screen.getByText('Primeira campanha')).toBeTruthy()
  })

  it('explains how to schedule when nothing is scheduled', async () => {
    const body = validCampaign()
    body.messages = body.messages.filter(message => message.id !== 'msg5')
    await renderApp({ path: '/gm', hunterId: null, body })

    expect(await screen.findByText(/Nada agendado/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Editor' })).toBeTruthy()
  })

  it('lists JSON errors by field, says players cannot open the campaign and blocks the Convite', async () => {
    const body = validCampaign()
    body.missions[0].value = 'cem'
    await renderApp({ path: '/gm', hunterId: null, body })

    expect(await screen.findByText('O JSON publicado tem erros')).toBeTruthy()
    expect(screen.getByText('/missions/0/value')).toBeTruthy()
    expect(screen.getByText('Os jogadores não conseguem abrir a campanha até o JSON ser corrigido.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copiar' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeTruthy()
  })

  it('explains when the JSON cannot be read at all', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: 'Not Found', status: 404 })

    expect(await screen.findByText('Não foi possível ler o JSON')).toBeTruthy()
    expect(screen.getByText(/HTTP 404/)).toBeTruthy()
  })
})
