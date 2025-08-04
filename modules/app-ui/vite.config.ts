import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import EnvironmentPlugin from 'vite-plugin-environment'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    EnvironmentPlugin('all', { prefix: 'VITE_' }),
    eslint({
      failOnError: false,
      failOnWarning: false,
      fix: message => {
        // eslint-disable-next-line no-console
        console.log(
          `auto fixing linting issue: ${message.ruleId}, message: ${message.message}, severity: ${message.severity}`,
          `\nline: ${message.line} - column: ${message.column}`,
          `\nmessageId: ${message.messageId}`,
          '\nto disable auto fix check vite.config.ts in project root',
        )
        return true
      },
    }),
  ],
  resolve: {
    alias: {
      misc: path.resolve(__dirname, '../misc/src'),
      client: path.resolve(__dirname, '../client/src'),
    },
  },
  server: { port: 8080 },
  optimizeDeps: {
    include: ['misc'],
  },
})
