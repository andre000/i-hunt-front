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
