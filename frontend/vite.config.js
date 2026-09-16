import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // En desarrollo el proxy evita CORS por completo: el navegador pide /api al
  // propio servidor de Vite y este reenvia al backend de Spring Boot.
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // changeOrigin solo reescribe Host: el header Origin sigue siendo el
          // del navegador (localhost:5173, 5174, …), asi que Spring trata la
          // peticion como cross-origin y la rechaza si ese puerto exacto no
          // esta en CorsConfig. Reescribiendo Origin al backend, la peticion
          // es same-origin y el proxy funciona en cualquier puerto.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', proxyTarget)
            })
          },
        },
      },
    },
  }
})
