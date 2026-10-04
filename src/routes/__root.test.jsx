import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

describe('app gate', () => {
  it('asks for the Convite when there is no campaign', async () => {
    await renderApp({ campaignUrl: null })

    expect(await screen.findByText('Você ainda não está numa campanha')).toBeTruthy()
  })

  it('shows an error when the campaign cannot be loaded', async () => {
    await renderApp({ body: 'Not Found', status: 404 })

    expect(await screen.findByText('Não foi possível carregar a campanha')).toBeTruthy()
  })

  it('shows an error to players when the JSON is invalid', async () => {
    await renderApp({ body: '{ quebrado' })

    expect(await screen.findByText('Não foi possível carregar a campanha')).toBeTruthy()
  })

  it('asks the player to choose a hunter', async () => {
    await renderApp({ hunterId: null })

    expect(await screen.findByText('Quem é você nesta campanha?')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ana' })).toBeTruthy()
  })

  it('asks the player to choose again when the saved hunter left the campaign', async () => {
    await renderApp({ hunterId: 'zeca' })

    expect(await screen.findByText('Quem é você nesta campanha?')).toBeTruthy()
  })

  it('asks before replacing the campaign with another Convite', async () => {
    await renderApp({ pendingInvite: 'https://pub-123.r2.dev/outra.json' })

    expect(await screen.findByText('Trocar de campanha?')).toBeTruthy()
  })

  it('opens the app when campaign and hunter are set', async () => {
    await renderApp()

    expect(await screen.findByText('Olá Ana')).toBeTruthy()
  })

  it('opens the GM view without a hunter, even with an invalid JSON', async () => {
    await renderApp({ path: '/gm', hunterId: null, body: '{ quebrado' })

    expect(await screen.findByText('Visão do GM')).toBeTruthy()
  })
})
