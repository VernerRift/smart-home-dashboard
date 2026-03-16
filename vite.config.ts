import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    // Добавляем разрешенные хосты
    allowedHosts: [
      'cryptoclastic-curt-prehensile.ngrok-free.dev',
      '.ngrok-free.app', // Разрешаем все поддомены ngrok
    ]
  }
})
