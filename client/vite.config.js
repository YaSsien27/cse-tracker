import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pass addresses starting with /api on to our Express server
    proxy: { '/api': process.env.API_URL || 'http://localhost:3001' },
  },
})
