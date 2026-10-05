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

  it('has a maskable icon for Android', () => {
    expect(pwaOptions.manifest.icons).toContainEqual(expect.objectContaining({ purpose: 'maskable', sizes: '512x512' }))
  })

  it('declares the manifest in Brazilian Portuguese', () => {
    expect(pwaOptions.manifest.lang).toBe('pt-BR')
  })

  it.each(pwaOptions.includeAssets)('included asset %s exists in public', (asset) => {
    expect(existsSync(publicPath(asset))).toBe(true)
  })
})

describe('index.html', () => {
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8')

  it('points the Apple touch icon to a 180x180 PNG', () => {
    const href = html.match(/<link rel="apple-touch-icon" href="([^"]+)"/)[1]
    expect(existsSync(publicPath(href))).toBe(true)
    expect(pngSize(href)).toBe('180x180')
  })
})
