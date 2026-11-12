import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/catchup': 'http://127.0.0.1:8000',
      '/then-now': 'http://127.0.0.1:8000',
      '/tasks': 'http://127.0.0.1:8000',
      '/tools': 'http://127.0.0.1:8000',
      '/feedback': 'http://127.0.0.1:8000',
      '/feed': 'http://127.0.0.1:8000',
      '/timeline': 'http://127.0.0.1:8000',
      '/personas': 'http://127.0.0.1:8000',
      '/learn-ai': 'http://127.0.0.1:8000',
      '/whats-happening': 'http://127.0.0.1:8000',
      '/ask': 'http://127.0.0.1:8000',
      '/glossary': 'http://127.0.0.1:8000',
      '/briefing': 'http://127.0.0.1:8000',
      '/stats': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000',
    }
  }
})
