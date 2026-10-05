import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pwaOptions } from './pwa.config'

const publicPath = (file) => new URL(`./public/${file.replace(/^\//, '')}`, import.meta.url)

function pngSize(file) {
  const png = readFileSync(publicPath(file))
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`
}

function cacheFor(url) {
  return pwaOptions.workbox.runtimeCaching.find(({ urlPattern }) => urlPattern.test(url))
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

  it.each([
    ['map tiles', 'https://tile.openstreetmap.org/15/12345/6789.png', 'CacheFirst'],
    ['font stylesheets', 'https://fonts.googleapis.com/css2?family=Geist:wght@400..800', 'StaleWhileRevalidate'],
    ['font files', 'https://fonts.gstatic.com/s/geist/v1/abc.woff2', 'CacheFirst'],
  ])('caches %s for offline use', (_, url, handler) => {
    const cache = cacheFor(url)
    expect(cache?.handler).toBe(handler)
    expect(cache.options.expiration.maxEntries).toBeGreaterThan(0)
  })

  it('does not cache requests to the campaign host', () => {
    expect(cacheFor('https://example.com/campanha.json')).toBeUndefined()
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
