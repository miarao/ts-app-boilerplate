import { InvokeToolRequest, McpServerConfig, ResourceListItem, ToolListItem } from 'mcp-hub-api'

import { HttpAdapter } from './http-adapter'
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

export class DefaultAdapterFactory implements McpAdapterFactory {
  create(cfg: McpServerConfig): McpServerAdapter {
    switch (cfg.transport.kind) {
      case 'stdio':
        return new StdioAdapter(cfg)
      case 'http':
        return new HttpAdapter(cfg)
      default:
        throw new Error(`Unsupported transport: ${(cfg as any).transport?.kind}`)
    }
  }
}
