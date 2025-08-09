import dotenv from 'dotenv'
import { HelloService } from 'hello-service'
import { createDefaultLogger, isLogLevel, Level } from 'logger'
import { failMe, Instant } from 'misc'
import { ModelHubService } from 'model-hub-service'
import { ThingStoreLocal } from 'thing-store-local'

import { ServicesLocal } from './services-local'

// Load environment variables
dotenv.config()

/**
 * Sets up and runs a ServicesLocal instance with all services
 */
async function start() {
  // eslint-disable-next-line no-process-env
  const maybeLogLevel = process.env.LOG_LEVEL ?? ''
  const logLevel = isLogLevel(maybeLogLevel) ? (maybeLogLevel as Level) : 'info'
  const logger = createDefaultLogger(logLevel)

  logger.info(`starting services with log level: ${logLevel}`)

  const clock = Instant.now()
  const thingStore = new ThingStoreLocal()

  // Initialize the thing store
  await thingStore.initialize()
  logger.info('Thing store initialized')

  // Create the services-local server
  const servicesLocal = new ServicesLocal(7077, logger)
  // const internalClientUrl = 'http://localhost:7077'

  // Create all service instances with shared store
  const helloService = new HelloService(logger, clock, thingStore)

  // eslint-disable-next-line no-process-env
  const GoogleAiApiKey = process.env.GOOGLE_AI_API_KEY || failMe('GOOGLE_AI_API_KEY environment variable is required')
  const modelHubService = new ModelHubService(logger, GoogleAiApiKey)

  // Register all services
  servicesLocal.registerService('hello', helloService)
  servicesLocal.registerService('model-hub', modelHubService)

  // Start the server
  await servicesLocal.start()

  logger.info('🎉 All services are running! Available services:')
  logger.info(`📋 Services: ${servicesLocal.listServices().join(', ')}`)

  // Example usage logs
  logger.info(`
📖 EXAMPLE USAGE:

# 1. Health check:
curl http://localhost:7077/health
`)
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('\n👋 Gracefully shutting down...')
  // eslint-disable-next-line no-process-exit
  process.exit(0)
})

process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('\n👋 Gracefully shutting down...')
  // eslint-disable-next-line no-process-exit
  process.exit(0)
})

// Run the services
start().catch(err => {
  // eslint-disable-next-line no-console
  console.error('💥 Error starting services:', err)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
