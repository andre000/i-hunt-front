import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { validCampaign } from '../../campaign/fixtures'

afterEach(cleanup)

describe('GM view', () => {
  it('shows the campaign, its hunters with earnings and every mission', async () => {
    const body = validCampaign()
    body.missions[0].hunters = ['ana']
    body.missions[0].result = 'concluída'
    body.missions.push({ id: 'later', name: 'Caça futura', location: 'Centro', value: 10, risk: 'baixo', postedAt: '2026-10-05T09:00:00-03:00' })
    await renderApp({ path: '/gm', hunterId: null, body })

    expect(await screen.findByText('Noite em Porto Alegre')).toBeTruthy()
    expect(screen.getByText(/Data da campanha:/)).toBeTruthy()
    expect(screen.getByText('4.5 ★ · R$ 800,00')).toBeTruthy()
    expect(screen.getByText('Concluída · Ana')).toBeTruthy()
    expect(screen.getByText('Agendada · em 12 horas')).toBeTruthy()
  })

  it('shows the Convite of the campaign', async () => {
    await renderApp({ path: '/gm', hunterId: null })

    const invite = await screen.findByLabelText('Convite da campanha')
    expect(invite.value).toContain('?campanha=https%3A%2F%2Fpub-123.r2.dev%2Fcampanha.json')
  })

  it('lists JSON errors by field and says players cannot open the campaign', async () => {
    const body = validCampaign()
    body.missions[0].value = 'cem'
    await renderApp({ path: '/gm', hunterId: null, body })

    expect(await screen.findByText('O JSON publicado tem erros')).toBeTruthy()
    expect(screen.getByText('/missions/0/value')).toBeTruthy()
    expect(screen.getByText('Os jogadores não conseguem abrir a campanha até o JSON ser corrigido.')).toBeTruthy()
  })

  it('explains when the JSON cannot be read at all', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: 'Not Found', status: 404 })

    expect(await screen.findByText('Não foi possível ler o JSON')).toBeTruthy()
    expect(screen.getByText(/HTTP 404/)).toBeTruthy()
  })
})
