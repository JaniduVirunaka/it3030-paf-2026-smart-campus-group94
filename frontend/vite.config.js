import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app'
      //'ngrok config add-authtoken 3CS50xbV6oKoZFn7fZCiB6PKpRv_6Yt3qPSe78YfHB4swVnXA' 
    ]
  }
})
