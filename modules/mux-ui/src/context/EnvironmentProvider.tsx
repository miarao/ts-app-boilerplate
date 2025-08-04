import { failMe } from 'misc'
import type { ReactNode } from 'react'
import { useContext } from 'react'
import React from 'react'
import { createContext, useMemo } from 'react'

export type EnvVars = {
  apiUrl: string
  logLevel: string
  spotifyClientId: string
  spotifyRedirectTarget: string
  [key: string]: string
}

const EnvironmentContext = createContext<EnvVars | undefined>(undefined)

interface EnvironmentProviderProps {
  children: ReactNode
  // Optional override values for testing
  testValues?: Partial<EnvVars>
}

/**
 * Provider component that makes environment variables available through context
 */
export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  // Create our environment variables object
  const envVars = useMemo((): EnvVars => {
    // eslint-disable-next-line no-process-env
    const env = process.env
    const viteEnvVars: EnvVars = {
      // API URLs
      apiUrl: env.VITE_DOCUMENT_API_URL || 'http://localhost:1404',
      logLevel: env.VITE_DEBUG === 'true' ? 'debug' : env.VITE_LOG_LEVEL ? env.VITE_LOG_LEVEL : 'info',
      spotifyClientId: env.VITE_SPOTIFY_CLIENT_ID || failMe('missing env variable: Spotify client id'),
      spotifyRedirectTarget:
        env.VITE_SPOTIFY_REDIRECT_TARGET || failMe('missing env variable: Spotify redirect target'),
    }

    // Override with test values if provided (useful for testing)
    return { ...viteEnvVars }
  }, [])

  return <EnvironmentContext.Provider value={envVars}>{children}</EnvironmentContext.Provider>
}

/**
 * Hook to access environment variables
 * @returns The environment variables object
 */
export function useEnvVars(): EnvVars {
  const context = useContext(EnvironmentContext)

  if (context === undefined) {
    throw new Error('useEnvVars must be used within an EnvironmentProvider')
  }

  return context
}
