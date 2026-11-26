import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Send API calls to the backend so the app and API share one origin in
    // development (the auth cookie is SameSite=strict).
    proxy: {
      '/api': process.env.VITE_BACKEND_URL || 'http://localhost:3000',
    },
  },
})
