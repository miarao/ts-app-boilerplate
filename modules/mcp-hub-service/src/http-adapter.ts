// modules/mcp-hub-core/src/adapters/http-adapter.ts
import { McpServerAdapter } from '../adapter'
import { McpServerConfig, InvokeToolRequest, ToolListItem, ResourceListItem } from 'mcp-hub-api'
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export class HttpAdapter implements McpServerAdapter {
  private client?: McpClient
  private running = false
  readonly id: string

  constructor(private cfg: McpServerConfig) { this.id = cfg.id }

  async start(): Promise<void> {
    if (this.running) return
    const transport = new StreamableHTTPClientTransport(this.cfg.transport.url, {
      headers: this.cfg.transport.headers,
    })
    this.client = new McpClient({ name: `mcp-hub:${this.cfg.name}`, version: this.cfg.version })
    await this.client.connect(transport)
    this.running = true
  }

  async stop(): Promise<void> {
    if (!this.running) return
    await this.client?.close()
    this.running = false
  }

  isRunning(): boolean { return this.running }

  async listTools(): Promise<ToolListItem[]> {
    const out = await this.client!.listTools()
    return out.tools.map(t => ({ name: t.name, title: t.title, description: t.description }))
  }

  async listResources(): Promise<ResourceListItem[]> {
    const out = await this.client!.listResources()
    return out.resources.map(r => ({ uri: r.uri, name: r.name, description: r.description }))
  }

  async invokeTool({ tool, params }: { tool: string; params: unknown }): Promise<unknown> {
    const result = await this.client!.callTool(tool, params ?? {})
    // The SDK returns a content array; you can normalize to plain JSON/text if desired.
    return result
  }
}