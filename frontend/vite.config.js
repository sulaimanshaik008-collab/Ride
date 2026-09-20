import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use the repository path for GitHub Pages, but the site root on Vercel.
const base = process.env.VERCEL ? '/' : '/Ride/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
