import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

describe('demo entry', () => {
  it('opens with the English welcome card and then the hunter choice', async () => {
    await renderApp({ demo: { introSeen: false } })

    expect(await screen.findByRole('heading', { name: 'A gig app for monster hunters' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start demo' }))
    expect(await screen.findByText('Quem é você nesta campanha?')).toBeTruthy()
  })

  it('offers the demo on the screen without a campaign', async () => {
    await renderApp({ campaignUrl: null })

    const link = await screen.findByRole('link', { name: 'Ver demonstração' })
    expect(link.getAttribute('href')).toBe('/demo')
  })

  it('lets the visitor retry or leave when the example does not load', async () => {
    const { leaveDemo } = await renderApp({ demo: { hunterId: 'ana', status: 404 } })

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sair da demo' }))
    await screen.findByRole('button', { name: 'Sair da demo' })
    expect(leaveDemo).toHaveBeenCalledOnce()
  })
})

describe('demo bar', () => {
  it('advances the night and shows what changed', async () => {
    await renderApp({ path: '/search', demo: { hunterId: 'ana' } })

    expect(await screen.findByText('Noite 1')).toBeTruthy()
    expect(screen.queryByText('Culto às margens do Guaíba')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Avançar a noite' }))

    expect(await screen.findByText('Culto às margens do Guaíba')).toBeTruthy()
    expect(screen.getByText('Noite 2')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Nova caça no mapa · 1 mensagem nova')
  })

  it('offers a restart on the last night that goes back to the hunter choice', async () => {
    await renderApp({ demo: { hunterId: 'ana', night: 3 } })

    fireEvent.click(await screen.findByRole('button', { name: 'Recomeçar demo' }))

    expect(await screen.findByText('Quem é você nesta campanha?')).toBeTruthy()
    expect(screen.getByText('Noite 1')).toBeTruthy()
  })

  it('leaves the demo from the bar', async () => {
    const { leaveDemo, sync } = await renderApp({ demo: { hunterId: 'ana' } })

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }))

    await screen.findByText('Noite 1')
    expect(leaveDemo).toHaveBeenCalledOnce()
    expect(sync.getHunterId()).toBeNull()
  })

  it('is hidden on the GM view', async () => {
    await renderApp({ path: '/gm', demo: { hunterId: 'ana' } })

    await screen.findByText('Noites de Porto Alegre')
    expect(screen.queryByRole('button', { name: 'Avançar a noite' })).toBeNull()
  })
})

describe('demo restart from a deep screen', () => {
  it('lands on the home map after choosing a hunter again', async () => {
    await renderApp({ path: '/mission/culto-guaiba', demo: { hunterId: 'ana', night: 3 } })

    fireEvent.click(await screen.findByRole('button', { name: 'Recomeçar demo' }))
    fireEvent.click(await screen.findByRole('button', { name: /Ana Souza/ }))

    expect(await screen.findByText('Seus ganhos')).toBeTruthy()
  })
})
