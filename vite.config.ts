import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright({
        launch: {
          headless: true,
        },
      }),
      instances: [
        { browser: 'firefox' },
      ],
    },
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
