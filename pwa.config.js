const DAY = 60 * 60 * 24

export const pwaOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png', 'exemplo-campanha.json'],
  manifest: {
    name: 'iHunt',
    short_name: 'iHunt',
    lang: 'pt-BR',
    description: 'Seu novo trabalho? Ser um herói urbano!',
    theme_color: '#0c0e11',
    background_color: '#0c0e11',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: { maxEntries: 500, maxAgeSeconds: 30 * DAY },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'font-stylesheets',
          expiration: { maxEntries: 10 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'font-files',
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * DAY },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
}
