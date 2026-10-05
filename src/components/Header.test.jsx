import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

describe('Header', () => {
  it('shows the page title and the campaign date', async () => {
    await renderApp({ path: '/search' })

    expect(await screen.findByRole('heading', { name: 'Caças' })).toBeTruthy()
    expect(screen.getByLabelText(/^Data da campanha:/)).toBeTruthy()
  })
})
