import axios, { AxiosInstance } from 'axios'
import { ReplCli } from 'cli' // interactive prompt only :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import { createDefaultLogger, Logger } from 'logger'

interface ServicesClientConfig {
  baseUrl: string
  logger?: Logger
}

interface InvokeRequest {
  serviceName: string
  request: {
    endpointName: string
    responseFormat: 'framed'
    requestData?: unknown
  }
}

/**
 * Interactive CLI for calling local services.
 * Does _not_ import or reference yargs.
 */
export class ServicesCLI {
  private readonly session = new ReplCli()
  private readonly client: AxiosInstance
  private readonly logger: Logger

  constructor(config: ServicesClientConfig) {
    this.logger = config.logger ?? createDefaultLogger()
    this.client = axios.create({ baseURL: config.baseUrl })
  }

  async run(): Promise<void> {
    await this.session.begin()
    this.session.inform(`Interactive CLI started. Type 'help' for commands. Type 'exit' or 'quit' to end.`)

    while (true) {
      try {
        const raw = await this.session.ask('>> ', async v => v)
        const input = raw.trim()
        if (!input) {
          continue
        }
        if (/^(exit|quit)$/i.test(input)) {
          break
        }

        // Split into command and the rest of the line
        const [cmd, ...restTokens] = input.split(/\s+/)
        const rest = restTokens.join(' ')

        switch (cmd) {
          case 'help':
            this.printHelp()
            continue
          case 'services':
            await this.listServices()
            continue
          default:
            await this.invokeService(cmd, rest)
        }
      } catch (err) {
        this.session.inform(err instanceof Error ? `Error: ${err.message}` : `Error: ${String(err)}`)
      }
    }

    await this.session.finish()
  }

  private printHelp(): void {
    this.logger.info('Commands:')
    this.logger.info('  services                              List available services')
    this.logger.info('  <service> <endpoint> [JSON requestData]  Invoke a service endpoint')
    this.logger.info('  help                                  Show this help')
    this.logger.info('  exit, quit                            Exit')
    this.logger.info('')
    this.logger.info('Examples:')
    this.logger.info(
      '  paper-processor createPaper {"format":"plain","rawContentOrReference":"Sample text","metadata":{"source":"api","tags":{}}}',
    )
    this.logger.info('  hello helloMember {"name":"John Doe"}')
    this.logger.info('  hello getMembers {}')
  }

  private async listServices(): Promise<void> {
    try {
      const res = await this.client.get<string[]>('/services')
      this.logger.info(JSON.stringify(res.data, null, 2))
    } catch (err: unknown) {
      this.logger.error(`Error listing services: ${(err as Error).message}`)
    }
  }

  private async invokeService(service: string, rest: string): Promise<void> {
    this.logger.info(`received command: ${service}, the rest is: ${rest}`)

    // Parse endpoint and request data
    const parts = rest.trim().split(' ')
    if (parts.length < 1) {
      this.logger.error('Invalid invocation. Usage: <service> <endpoint> [JSON requestData]')
      return
    }

    const endpoint = parts[0]
    const requestDataStr = parts.slice(1).join(' ')

    this.logger.info(`endpoint is: ${endpoint}, requestData: ${requestDataStr}`)

    const url = `/invoke`
    try {
      let requestData: unknown = {}

      // Parse the request data if provided
      if (requestDataStr && requestDataStr.trim()) {
        try {
          requestData = JSON.parse(requestDataStr)
        } catch (parseErr: unknown) {
          this.logger.error(`Invalid JSON requestData: ${(parseErr as Error).message} requestData: ${requestDataStr}`)
          return
        }
      }

      // Construct the proper InvokeRequest payload
      const payload: InvokeRequest = {
        serviceName: service,
        request: {
          endpointName: endpoint,
          responseFormat: 'framed',
          requestData,
        },
      }

      this.logger.debug(`Sending payload: ${JSON.stringify(payload, null, 2)}`)
      const response = await this.client.post<unknown>(url, payload)
      this.logger.info(JSON.stringify(response.data, null, 2))
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const data = err.response?.data
        this.logger.error(`HTTP ${status}: ${JSON.stringify(data)}`)
      } else {
        this.logger.error(`Error: ${(err as Error).message}`)
      }
    }
  }
}
