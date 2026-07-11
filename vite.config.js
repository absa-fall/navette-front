import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        id: '/',
        name: 'UADB Mobilité',
        short_name: 'UADB Mobilité',
        description: "Navette et voyages d'études - Université Alioune Diop de Bambey",
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo-uadb.png',
            sizes: '224x224',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
 server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
    allowedHosts: ['bagpipe-stream-ambitious.ngrok-free.dev'],
  },
})