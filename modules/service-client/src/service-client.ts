import axios, { AxiosInstance } from 'axios'
import { createDefaultLogger, Logger } from 'logger'
import { Transport } from 'transport'

/**
 * Axios-backed Transport for client-side calls
 */
export class HttpTransport implements Transport {
  constructor(
    private readonly logger: Logger = createDefaultLogger('info'),
    private client: AxiosInstance = axios.create(),
  ) {}

  async send<Req, Resp>(endpointName: string, payload: Req, options?: { rawMode?: boolean }): Promise<Resp> {
    this.logger.debug(`Sending request to ${endpointName}`)
    const response = await this.client.post<Resp>(`/api/${endpointName}`, payload, {
      params: options?.rawMode ? { rawMode: true } : undefined,
    })

    this.logger.debug(`Received response from ${endpointName}`)
    return response.data
  }

  sendUnawaited<Req>(endpointName: string, payload: Req): void {
    this.logger.debug(`Sending unwaited request to ${endpointName}`)
    this.client.post(`/api/${endpointName}`, payload).catch(err => {
      this.logger.error(`Error in unwaited request to ${endpointName}`, err)
    })
  }
}

/**
 * Create a strongly-typed client from an endpoint map and Transport.
 *
 * @template T - A record of endpoint functions that take a request and return a Promise of a response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient<T extends Record<string, (req: any) => Promise<any>>>(
  catalog: T,
  transport: Transport,
): {
  [K in keyof T]: (req: Parameters<T[K]>[0]) => ReturnType<T[K]>
} {
  // Initialize client with correct shape
  const client = {} as {
    [K in keyof T]: (req: Parameters<T[K]>[0]) => ReturnType<T[K]>
  }

  // catalog keys are endpoint names
  for (const name in catalog) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client[name] = ((req: any) => transport.send(name, req)) as any
  }

  return client
}
