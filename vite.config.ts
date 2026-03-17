import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Добавляем и конкретный хост, и маску для надежности
    allowedHosts: [
      'cryptoclastic-curt-prehensile.ngrok-free.dev',
      '.ngrok-free.app'
    ],
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
