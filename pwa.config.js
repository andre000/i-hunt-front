export const pwaOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'favicon.png'],
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
    ],
  },
}
