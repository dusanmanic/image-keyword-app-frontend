import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL;
  
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      proxy: {
        '/analyze': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/auth': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/tsv': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
})
