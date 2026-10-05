import { describe, expect, it } from 'vitest'
import { formatBRL } from './format'

describe('formatBRL', () => {
  it('formats a value with cents using a decimal comma', () => {
    expect(formatBRL(250.5)).toBe('R$ 250,50')
  })

  it('adds two decimal places and groups thousands with a dot', () => {
    expect(formatBRL(1500)).toBe('R$ 1.500,00')
  })

  it('rounds to two decimal places', () => {
    expect(formatBRL(99.999)).toBe('R$ 100,00')
  })
})
