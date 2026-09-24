import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps) {
        // Keep landing HTML free of leaflet/peer preloads — those load on play/join.
        return deps.filter(
          (d) =>
            !/(^|\/)leaflet-|(^|\/)peer-|(^|\/)peerRoom-|(^|\/)GuessMap-|(^|\/)MonkLobby-|(^|\/)voiceChat-/.test(
              d,
            ),
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet') || id.includes('@react-leaflet')) {
            return 'leaflet'
          }
          if (
            id.includes('node_modules/peerjs') ||
            id.includes('node_modules/webrtc-adapter') ||
            id.includes('node_modules/sdp') ||
            id.includes('node_modules/@msgpack') ||
            id.includes('peerjs-js-binarypack')
          ) {
            return 'peer'
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) {
            return 'react-vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 450,
  },
  server: {
    host: '0.0.0.0',
    port: 47447,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:47448',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 47447,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:47448',
        changeOrigin: true,
      },
    },
  },
})
