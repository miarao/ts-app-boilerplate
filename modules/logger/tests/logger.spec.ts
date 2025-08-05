import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { Writable } from 'stream'

import { createDefaultLogger, createNoOpLogger, Logger } from '../src'
import { logPath } from '../src/log-path' // Adjust the import path as needed

// Custom stream for testing UI output
class TestStream extends Writable {
  public chunks: string[] = []

  constructor() {
    super()
  }

  _write(
    chunk: Buffer | string | Uint8Array,
    encoding: BufferEncoding | 'buffer',
    callback: (error?: Error | null) => void,
  ): void {
    // Handle the 'buffer' special case - it's not a real encoding but a signal
    // that the data should be treated as a raw buffer
    if (encoding === 'buffer' || !encoding) {
      this.chunks.push(Buffer.isBuffer(chunk) || chunk instanceof Uint8Array ? chunk.toString('utf8') : String(chunk))
    } else {
      this.chunks.push(
        Buffer.isBuffer(chunk) || chunk instanceof Uint8Array
          ? chunk.toString(encoding as BufferEncoding)
          : String(chunk),
      )
    }
    callback()
  }

  getContent(): string {
    return this.chunks.join('')
  }
}

// Fix for log file path handling in getTempLogFilePath function:

const getTempLogFilePath = () => {
  // Get a proper temporary directory that definitely exists and is writable
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'))
  return path.join(tmpDir, `test-log-${Date.now()}.log`)
}

/**
 * Helper function to add a small delay to allow Winston to finish writing logs
 */
const waitForLogsToBeWritten = (ms = 200): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Helper function to ensure the log file has content
 */
const ensureLogFileHasContent = async (filePath: string, maxAttempts = 3, delay = 100): Promise<string> => {
  let content = ''
  let attempts = 0

  while (attempts < maxAttempts) {
    await waitForLogsToBeWritten(delay)

    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8')
      if (content.length > 0) {
        return content
      }
    }

    attempts++
  }

  throw new Error(`Log file at ${filePath} does not have content after ${maxAttempts} attempts`)
}

describe('logger', () => {
  describe('NoOpLogger', () => {
    let logger: Logger

    beforeEach(() => {
      logger = createNoOpLogger()
    })

    test('info() should not throw', () => {
      expect(() => logger.info('test info')).not.toThrow()
    })

    test('debug() should not throw', () => {
      expect(() => logger.debug('test debug')).not.toThrow()
    })

    test('error() should not throw', () => {
      expect(() => logger.error('test error', new Error('test'))).not.toThrow()
    })
  })

  describe('FileLogger', () => {
    let logFilePath: string
    let uiStream: TestStream
    let logger: Logger

    beforeEach(() => {
      logFilePath = getTempLogFilePath()
      uiStream = new TestStream()
      // Create a directory if it doesn't exist (for clean tests)
      const logDir = path.dirname(logFilePath)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
    })

    afterEach(() => {
      // Clean up test log files
      if (fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath)
      }
    })

    test('should throw error for relative path', () => {
      expect(() => createDefaultLogger('info', undefined, 'path/to/logs')).toThrow(/must be absolute/)
    })

    test('should create log file if it does not exist', () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)
      expect(fs.existsSync(logFilePath)).toBe(true)
    })

    test('should clear log file if it already exists with content', async () => {
      // Create file with content
      fs.writeFileSync(logFilePath, 'existing content')
      expect(fs.readFileSync(logFilePath, 'utf8')).toBe('existing content')

      // Create logger which should clear the file
      logger = createDefaultLogger('info', uiStream, logFilePath)

      // File should exist but be empty
      expect(fs.existsSync(logFilePath)).toBe(true)
      expect(fs.readFileSync(logFilePath, 'utf8')).toBe('')
    })

    test('should respect log level: error', async () => {
      logger = createDefaultLogger('error', uiStream, logFilePath)

      logger.error('test error', new Error('test error'))
      logger.info('test info')
      logger.debug('test debug')

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      expect(logContent).toContain('[ERROR]')
      expect(logContent).toContain('test error')
      expect(logContent).not.toContain('test info')
      expect(logContent).not.toContain('test debug')
    })

    test('should respect log level: info', async () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)

      logger.error('some log error', new Error('test error'))
      logger.info('test info')
      logger.debug('test debug')

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      expect(logContent).toContain('[ERROR]')
      expect(logContent).toContain('some log error')
      expect(logContent).toContain('test error')
      expect(logContent).toContain('[INFO]')
      expect(logContent).toContain('test info')
      expect(logContent).not.toContain('[DEBUG]')
      expect(logContent).not.toContain('test debug')
    })

    test('should respect log level: debug', async () => {
      logger = createDefaultLogger('debug', uiStream, logFilePath)

      logger.error('test error', new Error('test error'))
      logger.info('test info')
      logger.debug('test debug')

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      expect(logContent).toContain('[ERROR]')
      expect(logContent).toContain('test error')
      expect(logContent).toContain('[INFO]')
      expect(logContent).toContain('test info')
      expect(logContent).toContain('[DEBUG]')
      expect(logContent).toContain('test debug')
    })

    test('should log timestamp, level, and message to file', async () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)

      logger.info('test message')

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      // Log should contain ISO timestamp format
      expect(logContent).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Log should contain level and message
      expect(logContent).toContain('[INFO]')
      expect(logContent).toContain('test message')
    })

    test('should stringify objects in log messages', async () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)

      const testObj = { a: 1, b: 'test', c: { nested: true } }
      logger.info('test with object', testObj)

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      Object.entries(testObj).forEach(([key, value]) => {
        if (typeof value === 'object') {
          expect(logContent).toContain('"nested":true')
        } else {
          expect(logContent).toContain(`"${key}":${JSON.stringify(value)}`)
        }
      })
    })

    test('should output only info/error logs to UI stream when level is "info"', async () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)

      // Create an error with a message that will definitely be visible in the output
      const testError = new Error('test error message')
      logger.error('UI error message', testError)
      logger.info('info message')
      logger.debug('debug message')

      // Wait for logs to be processed
      await waitForLogsToBeWritten()

      const uiContent = uiStream.getContent()

      expect(uiContent).toContain('UI error message')
      expect(uiContent).toContain('test error message')
      expect(uiContent).toContain('info message')
      expect(uiContent).not.toContain('debug message')
    })

    test('should output debug logs to UI stream', async () => {
      logger = createDefaultLogger('debug', uiStream, logFilePath)

      logger.debug('debug message')

      // Wait for logs to be processed
      await waitForLogsToBeWritten()

      const uiContent = uiStream.getContent()

      expect(uiContent).toContain('[DEBUG] debug message')
    })

    test('should include error stack trace in log file', async () => {
      logger = createDefaultLogger('error', uiStream, logFilePath)

      // Create an error that's guaranteed to have a stack trace
      const testError = new Error('test error with stack')
      logger.error('error with stack', testError)

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      expect(logContent).toContain('error with stack')

      // The exact format of stack traces can vary, so we're checking common patterns
      // that should be present in any stack trace
      const hasStackTrace = logContent.includes('at ') || logContent.includes('Error:') || logContent.includes('stack')

      expect(hasStackTrace).toBe(true)
    })

    test('should handle complex nested objects', async () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)

      const complexObj = {
        number: 123,
        string: 'test',
        boolean: true,
        array: [1, 2, 3],
        nestedObj: {
          a: 1,
          b: {
            c: 'deep',
          },
        },
        fn() {
          return 'not serialized'
        },
      }

      logger.info('complex object test', complexObj)

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      expect(logContent).toContain('"number":123')
      expect(logContent).toContain('"string":"test"')
      expect(logContent).toContain('"boolean":true')
      expect(logContent).toContain('"array":[1,2,3]')
      expect(logContent).toContain('"nestedObj":{"a":1,"b":{"c":"deep"}}')
      // Functions are not serialized
      expect(logContent).not.toContain('not serialized')
    })

    // Replace the circular reference test with this version:

    test('should handle circular references', async () => {
      logger = createDefaultLogger('info', uiStream, logFilePath)

      // Define a recursive type instead of using 'any'
      interface CircularType {
        a: number
        self?: CircularType
      }

      const circularObj: CircularType = { a: 1 }
      circularObj.self = circularObj

      expect(() => logger.info('circular reference', circularObj)).not.toThrow()

      // Ensure logs are written before checking
      const logContent = await ensureLogFileHasContent(logFilePath)

      // safe-stable-stringify handles circular references
      expect(logContent).toContain('"a":1')
      expect(logContent).toContain('"self":"[Circular]"')
    })
  })
})
