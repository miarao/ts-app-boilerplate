import { errorLike } from 'misc'

/**
 * Logger level type
 */
export type Level = 'error' | 'info' | 'debug'

export const logLevels = ['error', 'info', 'debug']

/**
 * Interface for logger implementations
 */
export interface Logger {
  info(message: string, ...rest: unknown[]): void
  debug(message: string, ...rest: unknown[]): void
  error(message: string, err: unknown, ...rest: unknown[]): void
}

/**
 * Browser-compatible logger implementation that wraps console methods.
 */
export class BrowserLogger implements Logger {
  private readonly level: Level

  /**
   * Creates a new BrowserLogger
   * @param level The maximum log level to display (error < info < debug)
   */
  constructor(level: Level = 'info') {
    this.level = level
  }

  /**
   * Logs an info message
   * @param message The message to log
   * @param rest Additional parameters to log
   */
  info(message: string, ...rest: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, ...this.formatParams(rest))
    }
  }

  /**
   * Logs a debug message
   * @param message The message to log
   * @param rest Additional parameters to log
   */
  debug(message: string, ...rest: unknown[]): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...this.formatParams(rest))
    }
  }

  /**
   * Logs an error message
   * @param message The error message
   * @param err The error object or message
   * @param rest Additional parameters to log
   */
  error(message: string, err: unknown, ...rest: unknown[]): void {
    if (this.shouldLog('error')) {
      // Format the error
      const formattedError = this.formatError(err)
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, formattedError, ...this.formatParams(rest))
    }
  }

  /**
   * Formats error objects for consistent output
   */
  private formatError(err: unknown): unknown {
    if (err instanceof Error) {
      return {
        message: err.message,
        stack: err.stack,
        name: err.name,
      }
    }
    return errorLike(err)
  }

  /**
   * Formats the rest parameters for consistent logging
   */
  private formatParams(params: unknown[]): unknown[] {
    if (params.length === 0) {
      return []
    }

    return params.map(param => {
      // For objects, we want to make sure they're properly serialized/displayed
      if (typeof param === 'object' && param !== null) {
        return param
      }
      return param
    })
  }

  /**
   * Determines if a particular level should be logged based on the configured level
   */
  private shouldLog(messageLevel: Level): boolean {
    const levels: Record<Level, number> = {
      error: 0,
      info: 1,
      debug: 2,
    }

    return levels[messageLevel] <= levels[this.level]
  }
}

/**
 * A no-operation logger that discards all logs
 */
export class NopLogger implements Logger {
  info(_message: string, ..._rest: unknown[]): void {
    // No-op
  }

  debug(_message: string, ..._rest: unknown[]): void {
    // No-op
  }

  error(_message: string, _err: unknown, ..._rest: unknown[]): void {
    // No-op
  }
}

/**
 * Creates a logger that doesn't log anything
 */
export function createNoOpLogger(): Logger {
  return new NopLogger()
}

/**
 * Creates a browser logger with the specified log level
 * @param level The maximum log level to display
 */
export function createBrowserLogger(level: Level = 'info'): Logger {
  return new BrowserLogger(level)
}

/**
 * Creates the default logger for browser environments
 * This function signature matches the Node.js version for API compatibility
 */
export function createDefaultLogger(_unusedPath?: string, level: Level = 'info'): Logger {
  return createBrowserLogger(level)
}
