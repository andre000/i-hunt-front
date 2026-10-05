import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { validCampaign } from '../../campaign/fixtures'

afterEach(cleanup)

function campaignWith(mission) {
  const body = validCampaign()
  body.missions.push({ id: 'x', name: 'Caça X', location: 'Centro', value: 300, risk: 'alto', ...mission })
  return body
}

describe('mission detail', () => {
  it('shows status, risk, reward, deadline and posting time relative to the campaign date', async () => {
    await renderApp({
      path: '/mission/x',
      body: campaignWith({ deadline: '2026-10-07T21:00:00-03:00', postedAt: '2026-10-04T18:00:00-03:00', description: 'Cuidado.' }),
    })

    expect(await screen.findByText('Caça X')).toBeTruthy()
    expect(screen.getByText('Disponível')).toBeTruthy()
    expect(screen.getByText('Risco alto')).toBeTruthy()
    expect(screen.getByText('R$ 300,00')).toBeTruthy()
    expect(screen.getByText('em 3 dias')).toBeTruthy()
    expect(screen.getByText('há 3 horas')).toBeTruthy()
    expect(screen.getByText('Cuidado.')).toBeTruthy()
    expect(screen.getByText('Nenhum hunter nesta missão ainda.')).toBeTruthy()
  })

  it('lists the hunters on the mission', async () => {
    await renderApp({ path: '/mission/x', body: campaignWith({ hunters: ['ana', 'beto'] }) })

    expect(await screen.findByText('Em andamento')).toBeTruthy()
    expect(screen.getByText('Ana')).toBeTruthy()
    expect(screen.getByText('Beto')).toBeTruthy()
  })

  it('leaves out deadline, posting time and description when the mission has none', async () => {
    await renderApp({ path: '/mission/x', body: campaignWith({}) })

    expect(await screen.findByText('Caça X')).toBeTruthy()
    expect(screen.queryByText('Prazo')).toBeNull()
    expect(screen.queryByText('Publicada')).toBeNull()
  })

  it('does not show a scheduled mission', async () => {
    await renderApp({ path: '/mission/x', body: campaignWith({ postedAt: '2026-10-05T10:00:00-03:00' }) })

    expect(await screen.findByText('Missão não encontrada')).toBeTruthy()
    expect(screen.queryByText('Caça X')).toBeNull()
  })

  it('does not find an unknown mission', async () => {
    await renderApp({ path: '/mission/nada' })

    expect(await screen.findByText('Missão não encontrada')).toBeTruthy()
  })
})
