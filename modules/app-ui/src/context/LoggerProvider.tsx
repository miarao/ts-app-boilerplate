import type { ReactNode } from 'react'
import React, { createContext, useContext, useMemo } from 'react'

import type { Level, Logger } from '../logger/logger'
import { logLevels } from '../logger/logger'
import { createBrowserLogger } from '../logger/logger'
import { useEnvVars } from './EnvironmentProvider'

// Create a context for the logger
const LoggerContext = createContext<Logger | undefined>(undefined)

interface LoggerProviderProps {
  level?: Level
  children: ReactNode
  componentName?: string
}

/**
 * Provider component that makes the logger available to any
 * child component that calls the useLogger() hook.
 */
export const LoggerProvider: React.FC<LoggerProviderProps> = ({ componentName, children }) => {
  const maybeLogLevel = useEnvVars().logLevel

  const logger = useMemo(() => {
    const isLogLevel = (maybeLevel: string): maybeLevel is Level => logLevels.includes(maybeLevel as Level)

    if (!isLogLevel(maybeLogLevel)) {
      throw new Error(`Invalid level provided: ${maybeLogLevel}`)
    }

    const baseLogger = createBrowserLogger(maybeLogLevel satisfies Level)

    // If componentName is provided, create a prefixed logger
    if (componentName) {
      return {
        info(message: string, ...rest: unknown[]): void {
          baseLogger.info(`[${componentName}] ${message}`, ...rest)
        },
        debug(message: string, ...rest: unknown[]): void {
          baseLogger.debug(`[${componentName}] ${message}`, ...rest)
        },
        error(message: string, err: unknown, ...rest: unknown[]): void {
          baseLogger.error(`[${componentName}] ${message}`, err, ...rest)
        },
      }
    }

    return baseLogger
  }, [maybeLogLevel, componentName])

  return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>
}

export function useLogger(): Logger {
  const context = useContext(LoggerContext)

  if (context === undefined) {
    throw new Error('useLogger must be used within a LoggerProvider')
  }

  return context
}

/**
 * Helper hook that creates a component-specific logger
 * @param componentName The name of the component to be prefixed in logs
 */
export function useComponentLogger(componentName: string): Logger {
  const logger = useLogger()

  return useMemo(
    () => ({
      info(message: string, ...rest: unknown[]): void {
        logger.info(`[${componentName}] ${message}`, ...rest)
      },
      debug(message: string, ...rest: unknown[]): void {
        logger.debug(`[${componentName}] ${message}`, ...rest)
      },
      error(message: string, err: unknown, ...rest: unknown[]): void {
        logger.error(`[${componentName}] ${message}`, err, ...rest)
      },
    }),
    [logger, componentName],
  )
}
