import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  if (mode === 'production') {
    if (!env.VITE_API_URL) {
      throw new Error('VITE_API_URL mora biti podešen za produkcijski build')
    }
    const apiUrl = new URL(env.VITE_API_URL)
    if (apiUrl.protocol !== 'https:' || !apiUrl.pathname.replace(/\/$/, '').endsWith('/api')) {
      throw new Error('VITE_API_URL mora biti HTTPS URL koji završava sa /api')
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: true, // izlozi dev server na lokalnu mrezu (za testiranje s telefona)
    },
  }
})
