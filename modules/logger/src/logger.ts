import * as fs from 'fs'
import { format } from 'logform'
import * as os from 'os'
import * as path from 'path'
import jsonStringify from 'safe-stable-stringify'
import * as winston from 'winston'

import { logPath } from './log-path'

// TODO (om): Should keep dated log files w/ seperation per execution - how? - adding flush() to delete

// Define proper interfaces for our types
export type Level = 'error' | 'info' | 'debug'

export const logLevels = ['error', 'info', 'debug']

export const isLogLevel = (maybeLevel: string): maybeLevel is Level =>
  logLevels.includes(maybeLevel.toLowerCase() as Level)

export function fromString(maybeLevel: string) {
  if (isLogLevel(maybeLevel)) {
    return maybeLevel satisfies Level
  }
  return undefined
}

// Define log levels
const levels: Record<Level, number> = {
  error: 0,
  info: 1,
  debug: 2,
}

// Define logger interface
export interface Logger {
  info(message: string, ...rest: unknown[]): void
  debug(message: string, ...rest: unknown[]): void
  error(message: string, err?: unknown, ...rest: unknown[]): void
}

// Define extended Winston LogEntry to properly type our custom fields
interface ExtendedLogEntry {
  timestamp?: unknown
  stack?: unknown
  ui?: boolean
  level: string
  message: unknown
  [key: string]: unknown
}

// No-operation logger implementation
class NopLogger implements Logger {
  info(_message: string, ..._rest: unknown[]): void {
    // noop
  }

  debug(_message: string, ..._rest: unknown[]): void {
    // noop
  }

  error(_message: string, _err: unknown, ..._rest: unknown[]): void {
    // noop
  }
}

export function createNoOpLogger(): Logger {
  return new NopLogger()
}

export function createDefaultLogger(
  logLevel?: Level,
  uiStream?: NodeJS.WritableStream,
  logFilePath?: string,
): FileLogger {
  const logFile = logFilePath || logPath()

  if (!path.isAbsolute(logFile)) {
    throw new Error(`logDir must be absolute: ${logFile}`)
  }

  // Ensure the directory exists
  const logDir = path.dirname(logFile)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // Clear existing file if it exists
  if (fs.existsSync(logFile) && fs.statSync(logFile).size > 0) {
    fs.truncateSync(logFile, 0)
  }

  // Touch the file to ensure it exists
  fs.closeSync(fs.openSync(logFile, 'a'))

  return new FileLogger(logLevel, uiStream, logFile)
}

class FileLogger implements Logger {
  private readonly logger: winston.Logger

  constructor(logLevel: Level = 'info', uiStream: NodeJS.WritableStream = process.stdout, logFile: string) {
    if (!path.isAbsolute(logFile)) {
      throw new Error(`logDir must be absolute: ${logFile}`)
    }
    this.logger = newLogger(logFile, logLevel, uiStream)
  }

  info(message: string, ...rest: unknown[]): void {
    this.logger.info(message, { ...Object.fromEntries(rest.entries()), ui: true })
  }

  debug(message: string, ...rest: unknown[]): void {
    this.logger.debug(message, { ...Object.fromEntries(rest.entries()), ui: true })
  }

  error(message: string, err: unknown, ...rest: unknown[]): void {
    // Ensure error details are properly passed to winston
    if (err instanceof Error) {
      // Pass error object with explicit stack trace property
      this.logger.error(message, {
        error: err.message,
        stack: err.stack,
        ...Object.fromEntries(rest.entries()),
        ui: true,
      })
    } else {
      this.logger.error(message, {
        error: err,
        ...Object.fromEntries(rest.entries()),
        ui: true,
      })
    }
  }
}

// Helper function to join strings, filtering out falsy values
const joinTokens = (...tokens: (string | undefined)[]): string =>
  tokens
    .map(t => t?.trim())
    .filter(Boolean)
    .join(' ')

// Properly typed format functions
const finalFormat = format.printf(info => {
  const typedInfo = info satisfies ExtendedLogEntry

  // Extract properties we want to exclude from stringification
  const { level, message, timestamp, stack, ...rest } = typedInfo

  // Stringify the remaining properties
  let stringifiedRest = jsonStringify(rest) ?? '{}'

  if (stringifiedRest === '{}') {
    stringifiedRest = ''
  }

  // Safely convert values to expected types
  const safeTimestamp = typeof timestamp === 'string' ? timestamp : timestamp ? String(timestamp) : undefined

  const safeMessage = typeof message === 'string' ? message : message ? String(message) : ''

  const safeStack = typeof stack === 'string' ? stack : stack ? String(stack) : undefined

  return joinTokens(safeTimestamp, `[${level.toUpperCase()}]`, safeMessage, stringifiedRest, safeStack)
})

// Filter to only show messages marked for UI
const filterUi = format(info => {
  const typedInfo = info satisfies ExtendedLogEntry
  return typedInfo.ui ? typedInfo : false
})

const formatUi = format.printf(info => {
  const typedInfo = info satisfies ExtendedLogEntry

  // Safely convert values to expected types
  const safeMessage =
    typeof typedInfo.message === 'string' ? typedInfo.message : typedInfo.message ? String(typedInfo.message) : ''

  // Include the log level in the output
  const level = typedInfo.level ? `[${typedInfo.level.toUpperCase()}]` : ''

  // Handle error message from various sources
  let errorMessage = ''
  if (typedInfo.error) {
    if (typeof typedInfo.error === 'string') {
      errorMessage = typedInfo.error
    } else if (typedInfo.error instanceof Error) {
      errorMessage = typedInfo.error.message
    } else if (typeof typedInfo.error === 'object' && 'message' in typedInfo.error) {
      errorMessage = String(typedInfo.error.message)
    } else {
      errorMessage = String(typedInfo.error)
    }
  }

  // Extract stack trace
  const safeStack =
    typeof typedInfo.stack === 'string' ? typedInfo.stack : typedInfo.stack ? String(typedInfo.stack) : undefined

  return joinTokens(level, safeMessage, errorMessage, safeStack)
})

function newLogger(logFile: string, level: Level, uiStream: NodeJS.WritableStream): winston.Logger {
  // Create a file transport with sync writing enabled
  const fileTransport = new winston.transports.File({
    filename: logFile,
    level,
    format: format.combine(
      format.timestamp(),
      // Make sure to preserve the original Error object
      format.errors({ stack: true, message: true }),
      finalFormat,
    ),
    handleExceptions: true,
    eol: os.EOL,
  })

  // Create a stream transport for UI output
  const streamTransport = new winston.transports.Stream({
    stream: uiStream,
    level,
    format: format.combine(format.errors({ stack: true, message: true }), filterUi(), formatUi),
    handleExceptions: true,
  })

  return winston.createLogger({
    level: 'debug',
    levels,
    defaultMeta: undefined,
    transports: [fileTransport, streamTransport],
    exitOnError: false,
  })
}
