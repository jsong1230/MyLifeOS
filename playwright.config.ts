import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'https://mylifeos-virid.vercel.app',
    headless: true,
  },
  reporter: 'list',
})
