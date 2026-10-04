import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import svgr from "vite-plugin-svgr";
import { VitePWA } from 'vite-plugin-pwa'
import { pwaOptions } from './pwa.config'
import { readFileSync } from 'node:fs'

const CAMPAIGN_SCHEMA = new URL('./src/campaign/campaign.schema.json', import.meta.url)

function publishCampaignSchema() {
  return {
    name: 'publish-campaign-schema',
    configureServer(server) {
      server.middlewares.use('/campaign.schema.json', (_, response) => {
        response.setHeader('Content-Type', 'application/schema+json')
        response.end(readFileSync(CAMPAIGN_SCHEMA))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'campaign.schema.json', source: readFileSync(CAMPAIGN_SCHEMA) })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    projects: [
      { extends: true, test: { name: 'unit', include: ['**/*.test.js'], environment: 'node' } },
      { extends: true, test: { name: 'screens', include: ['**/*.test.jsx'], environment: 'jsdom' } },
    ],
  },
  plugins: [
    TanStackRouterVite({ routeFileIgnorePattern: '\\.test\\.' }),
    react(),
    svgr(),
    VitePWA(pwaOptions),
    publishCampaignSchema(),
  ],
})
