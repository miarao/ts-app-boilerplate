import * as http from 'http'
import * as https from 'https'
import { URL } from 'url'

import { Transport, TransportOptions } from './transport'

/**
 * Configuration for the HTTP transport.  A base URL must be
 * provided; the transport will append the endpoint name to this base
 * URL when making requests.
 */
export interface HttpTransportConfig {
  /**
   * Base URL pointing at the service.  Should include protocol and
   * host (e.g. "http://localhost:7077/api").  A trailing slash is
   * optional – it will be normalised when requests are made.
   */
  baseUrl: string
}

/**
 * Simple HTTP transport using the built‑in http/https modules.  It
 * serializes payloads to JSON and expects JSON responses.  On any
 * network or parse error, the promise is rejected.
 */
export class HttpTransport implements Transport {
  constructor(private readonly config: HttpTransportConfig) {}

  async send<Req, Resp>(endpointName: string, payload: Req, options?: TransportOptions): Promise<Resp> {
    const baseUrl = new URL(this.config.baseUrl)
    // Normalise the pathname to avoid duplicate slashes
    const pathBase = baseUrl.pathname.replace(/\/$/, '')
    baseUrl.pathname = `${pathBase}/${endpointName}`
    if (options?.rawMode) {
      baseUrl.searchParams.set('rawMode', 'true')
    }

    const data = JSON.stringify(payload ?? {})
    const isHttps = baseUrl.protocol === 'https:'
    const lib = isHttps ? https : http

    return new Promise((resolve, reject) => {
      const req = lib.request(
        baseUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
        },
        res => {
          let body = ''
          res.setEncoding('utf8')
          res.on('data', chunk => {
            body += chunk
          })
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              resolve(parsed as Resp)
            } catch (err) {
              reject(err)
            }
          })
        },
      )
      req.on('error', reject)
      req.write(data)
      req.end()
    })
  }

  sendUnawaited<Req>(endpointName: string, payload: Req): void {
    // Fire and forget – ignore the returned promise
    this.send(endpointName, payload).catch(() => {})
  }
}
