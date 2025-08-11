// modules/mcp-hub-core/src/adapters/stdio-adapter.ts
import { McpServer } from '@modelcontextprotocol/sdk'
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
// import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js' // not used here
import { McpServerConfig } from 'mcp-hub-api'
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process'

import { McpServerAdapter } from '../adapter'

export class StdioAdapter implements McpServerAdapter {
  private proc?: ChildProcessWithoutNullStreams
  private server?: McpServer // if you embed; for external process you only manage transport
  private running = false
  readonly id: string

  constructor(private cfg: McpServerConfig) {
    this.id = cfg.id
  }

  async start(): Promise<void> {
    if (this.running) {
      return
    }
    // External process: you spawn and wire stdio transport to client. For brevity we assume server runs itself.
    this.proc = spawn(this.cfg.transport.cmd, this.cfg.transport.args, {
      env: { ...process.env, ...this.cfg.transport.env },
    })
    // health-check / wait for ready could be added here
    this.running = true
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return
    }
    this.proc?.kill('SIGTERM')
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  async listTools() {
    /* call MCP listTools via a client connected over stdio */ return []
  }
  async listResources() {
    /* call MCP listResources */ return []
  }

  async invokeTool({ tool, params }: { tool: string; params: unknown }) {
    // wire an MCP client to the child stdio transport and call tool
    // (Left skeleton to keep blueprint focused; see HTTP adapter for shape)
    throw new Error('Not implemented in blueprint')
  }
}
