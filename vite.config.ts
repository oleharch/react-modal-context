/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'demo-dist',
    // Browsers with native light-dark(). Older targets make Lightning CSS rewrite it into a
    // prefers-color-scheme fallback that ignores `color-scheme`, which breaks the theme toggle.
    cssTarget: ['chrome123', 'edge123', 'firefox120', 'safari17.5'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})
