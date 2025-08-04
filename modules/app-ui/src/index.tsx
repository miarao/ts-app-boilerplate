import { CssBaseline, ThemeProvider } from '@mui/material'
import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { EnvironmentProvider } from './context/EnvironmentProvider'
import { LoggerProvider } from './context/LoggerProvider'
import { generalTheme } from './theme/custom-theme'

const container = document.getElementById('root')
if (!container) {
  throw new Error("No container element found with ID 'root'")
}

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={generalTheme}>
      <CssBaseline />
      <EnvironmentProvider>
        <LoggerProvider>
          <App />
        </LoggerProvider>
      </EnvironmentProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
