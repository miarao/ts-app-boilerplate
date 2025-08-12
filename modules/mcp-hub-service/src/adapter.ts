import { InvokeToolRequest, McpServerConfig, ResourceListItem, ToolListItem } from 'mcp-hub-api'

import { HttpAdapter } from './http-adapter'
import { RandomAdapter } from './random-mcp'
import { StdioAdapter } from './stdio-adapter'

export interface McpServerAdapter {
  readonly id: string
  start(): Promise<void>
  stop(): Promise<void>
  listTools(): Promise<ToolListItem[]>
  listResources(): Promise<ResourceListItem[]>
  invokeTool(req: Omit<InvokeToolRequest, 'serverId'>): Promise<unknown>
  isRunning(): boolean
}

export interface McpAdapterFactory {
  create(config: McpServerConfig): McpServerAdapter
}

export class DefaultAdapterFactory {
  create(config: McpServerConfig): McpServerAdapter {
    switch (config.transport) {
      case 'http':
      case 'ws':
        return new HttpAdapter(config)
      case 'grpc':
        return new GrpcAdapter(config)
      case 'stdio':
        return new StdioAdapter(config)
      default:
        if ((config as any).transport === 'random') {
          return new RandomAdapter()
        }
        throw new Error(`Unsupported transport: ${config.transport}`)
    }
  }
}
