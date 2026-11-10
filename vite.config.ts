import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import type { Plugin } from 'vite'
// @ts-expect-error Plain JavaScript module without type declarations.
import { createHandler, paths } from './server/local-server.mjs'

// Runs the local Thkee API inside the dev server at /thkee-api.
const thkeeApi = (): Plugin => ({
  name: 'thkee-local-api',
  apply: 'serve',
  configureServer(server) {
    const handle = createHandler('/thkee-api')
    server.middlewares.use('/thkee-api', (req, res) => void handle(req, res))
    console.log(`Thkee local API: /thkee-api (files in ${paths.uploads})`)
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), thkeeApi()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 8443,
  },
})
