import { randomUUID } from 'crypto'
import {
  RandomNumberRequest,
  RandomNumberResponse,
  RandomUuidRequest,
  RandomUuidResponse,
  ResourceDefinition,
  ToolDefinition,
} from 'mcp-hub-api'

import { McpServerAdapter } from './adapter'

/**
 * A discriminated union describing the supported tool invocation
 * requests for the random adapter.  The return type of
 * `invokeTool` is derived from this union via conditional types.
 */
export type RandomInvokeRequest =
  | { tool: 'randomNumber'; params: RandomNumberRequest }
  | { tool: 'randomUuid'; params: RandomUuidRequest }

/**
 * RandomAdapter provides a simple MCP server implementation that exposes
 * two tools: one for generating random numbers and another for
 * generating UUIDs.  It conforms to the `McpServerAdapter` interface
 * defined in mcp-hub-api and can be registered with the hub like any
 * other server.
 */
export class RandomAdapter implements McpServerAdapter {
  private running = false

  async start(): Promise<void> {
    // No external connections are required
    this.running = true
  }

  async stop(): Promise<void> {
    // nothing needs to be stopped, unmounded, or closed
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  /**
   * The random adapter exposes two tools: `randomNumber` and
   * `randomUuid`.  Descriptions are provided for clarity.
   */
  async listTools(): Promise<Array<ReturnType<(typeof ToolDefinition)['parse']>>> {
    return [
      { name: 'randomNumber', description: 'Generate a random floating‑point number' },
      { name: 'randomUuid', description: 'Generate a random UUID' },
    ]
  }

  /**
   * The random adapter does not expose any additional resources.
   */
  async listResources(): Promise<Array<ReturnType<(typeof ResourceDefinition)['parse']>>> {
    return []
  }

  /**
   * Invoke a supported tool.  The request discriminates on the tool
   * name and ensures that the parameter shape matches the tool's
   * requirements.  Unknown tools result in an error.
   */
  async invokeTool<T extends RandomInvokeRequest>(
    request: T,
  ): Promise<
    T extends { tool: 'randomNumber' }
      ? RandomNumberResponse
      : T extends { tool: 'randomUuid' }
      ? RandomUuidResponse
      : never
  > {
    switch (request.tool) {
      case 'randomNumber': {
        const params: RandomNumberRequest = request.params
        // Default range is [0, 1]
        const min = (params.min ?? 0) satisfies number
        const max = (params.max ?? 1) satisfies number
        const value = Math.random() * (max - min) + min
        return { value }
      }
      case 'randomUuid': {
        const uuid = randomUUID()
        return { uuid }
      }
      default:
        throw new Error(`Unknown tool: ${(request as any).tool}`)
    }
  }
}
