import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderApp } from '../test/renderApp'
import { validCampaign } from '../campaign/fixtures'

afterEach(cleanup)

describe('Header', () => {
  it('greets the chosen hunter with their rating', async () => {
    await renderApp({ path: '/search' })

    expect(await screen.findByText('Olá Ana')).toBeTruthy()
    expect(screen.getByText('4.5')).toBeTruthy()
  })

  it('hides the rating when the GM did not set one', async () => {
    await renderApp({ path: '/search', hunterId: 'beto', body: validCampaign() })

    expect(await screen.findByText('Olá Beto')).toBeTruthy()
    expect(screen.queryByText(/★|\d\.\d/)).toBeNull()
  })
})
