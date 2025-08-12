import { spawn } from 'child_process'

import { Transport, TransportOptions } from './transport'

/**
 * Configuration for the stdio transport.  The command and arguments
 * define the process that will be spawned for each request.  The
 * transport serialises the endpoint name and payload as JSON on
 * stdin and expects a JSON response on stdout.
 */
export interface StdioTransportConfig {
  /** Command to execute, e.g. a script or binary implementing the API. */
  command: string
  /** Optional arguments passed to the command. */
  args?: string[]
}

/**
 * STDIO transport spawns a new process per request, writing the
 * payload to its stdin and reading the response from stdout.  It
 * parses the entire stdout as JSON.  Errors and non‑zero exit codes
 * cause the returned promise to reject.
 */
export class StdioTransport implements Transport {
  constructor(private readonly config: StdioTransportConfig) {}

  async send<Req, Resp>(endpointName: string, payload: Req, _options?: TransportOptions): Promise<Resp> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.config.command, this.config.args ?? [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''
      child.stdout.on('data', chunk => {
        stdout += chunk.toString()
      })
      child.stderr.on('data', chunk => {
        stderr += chunk.toString()
      })
      child.on('error', reject)
      child.on('close', code => {
        if (code !== 0) {
          return reject(new Error(`Process exited with code ${code}: ${stderr.trim()}`))
        }
        try {
          const parsed = JSON.parse(stdout)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          resolve(parsed as Resp)
        } catch (err) {
          reject(err)
        }
      })
      // Send JSON containing the endpoint name and payload; adapt as needed
      const request = JSON.stringify({ endpointName, payload })
      child.stdin.write(request)
      child.stdin.end()
    })
  }

  sendUnawaited<Req>(endpointName: string, payload: Req): void {
    // Fire and forget; ignore any errors
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.send(endpointName, payload).catch(() => {})
  }
}
