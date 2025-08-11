import { McpAdapterFactory, McpServerAdapter, McpServerConfig } from 'mcp-hub-api'

import { HttpAdapter } from './http-adapter'
import { StdioAdapter } from './stdio-adapter'

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
