import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pwaOptions } from './pwa.config'

const publicPath = (file) => new URL(`./public/${file.replace(/^\//, '')}`, import.meta.url)

function pngSize(file) {
  const png = readFileSync(publicPath(file))
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`
}

describe('pwaOptions', () => {
  it.each(pwaOptions.manifest.icons)('icon $sizes points to a PNG of that size', (icon) => {
    expect(existsSync(publicPath(icon.src))).toBe(true)
    expect(pngSize(icon.src)).toBe(icon.sizes)
  })

  it('declares the manifest in Brazilian Portuguese', () => {
    expect(pwaOptions.manifest.lang).toBe('pt-BR')
  })

  it.each(pwaOptions.includeAssets)('included asset %s exists in public', (asset) => {
    expect(existsSync(publicPath(asset))).toBe(true)
  })
})
