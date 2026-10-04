import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import svgr from "vite-plugin-svgr";
import { VitePWA } from 'vite-plugin-pwa'
import { pwaOptions } from './pwa.config'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
  },
  plugins: [
    TanStackRouterVite(),
    react(),
    svgr(),
    VitePWA(pwaOptions),
  ],
})
