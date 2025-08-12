import * as http2 from 'http2'
import { URL } from 'url'

import { Transport, TransportOptions } from './transport'

/**
 * Configuration for the streamable HTTP (HTTP/2) transport.  Only
 * simple JSON request/response cycles are implemented here; true
 * streaming semantics would require returning an async iterator or
 * event emitter.  For now, the entire response body is read and
 * parsed as JSON.
 */
export interface StreamableHttpTransportConfig {
  /** Base URL for the service, e.g. "http://localhost:7077/api". */
  baseUrl: string
}

/**
 * HTTP/2 transport that sends requests via a persistent connection.
 * This implementation reads the full response into memory.  A more
 * advanced version could expose a streaming API.
 */
export class StreamableHttpTransport implements Transport {
  constructor(private readonly config: StreamableHttpTransportConfig) {}

  async send<Req, Resp>(endpointName: string, payload: Req, options?: TransportOptions): Promise<Resp> {
    const baseUrl = new URL(this.config.baseUrl)
    // Build the authority (scheme + host) for http2.connect
    const authority = `${baseUrl.protocol}//${baseUrl.host}`
    // Normalise pathname and append endpoint
    const pathBase = baseUrl.pathname.replace(/\/$/, '')
    const path = `${pathBase}/${endpointName}${options?.rawMode ? '?rawMode=true' : ''}`

    const client = http2.connect(authority)
    return new Promise((resolve, reject) => {
      client.on('error', err => {
        client.close()
        reject(err)
      })
      const req = client.request({
        ':method': 'POST',
        ':path': path,
        'content-type': 'application/json',
      })

      let body = ''
      req.setEncoding('utf8')
      req.on('data', chunk => {
        body += chunk
      })
      req.on('end', () => {
        client.close()
        try {
          const parsed = JSON.parse(body)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          resolve(parsed as Resp)
        } catch (err) {
          reject(err)
        }
      })
      req.on('error', err => {
        client.close()
        reject(err)
      })
      // Write payload
      req.end(JSON.stringify(payload ?? {}))
    })
  }

  sendUnawaited<Req>(endpointName: string, payload: Req): void {
    // Fire and forget; no error propagation
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.send(endpointName, payload).catch(() => {})
  }
}
