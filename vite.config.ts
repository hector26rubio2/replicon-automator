import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['REPLICON_', 'VITE_'])
  return {
  plugins: [react()],
  define: {
    'process.env.REPLICON_LOGIN_URL': JSON.stringify(env.REPLICON_LOGIN_URL),
    'process.env.REPLICON_TIMEOUT': JSON.stringify(env.REPLICON_TIMEOUT),
    'process.env.REPLICON_HEADLESS': JSON.stringify(env.REPLICON_HEADLESS),
    'process.env.REPLICON_AUTOSAVE': JSON.stringify(env.REPLICON_AUTOSAVE),
  },
  base: './',
  root: 'src/renderer',
  publicDir: '../../assets',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  }
})
