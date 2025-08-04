import { createDefaultLogger } from 'logger'

import { ServicesCLI } from './services-cli'

async function main(): Promise<void> {
  const logger = createDefaultLogger('info')
  // eslint-disable-next-line no-process-env
  const baseUrl = process.env.SERVICES_SERVER_URL || 'http://localhost:7077'
  logger.info(`Connecting to services server at ${baseUrl}`)

  const cli = new ServicesCLI({ baseUrl, logger })
  try {
    await cli.run()
  } catch (error: unknown) {
    logger.error('Error running Services CLI:', error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Error starting services CLI:', err)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
