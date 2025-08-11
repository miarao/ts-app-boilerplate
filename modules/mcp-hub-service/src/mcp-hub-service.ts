// modules/mcp-hub-service/src/mcp-hub-service.ts
import { Logger } from 'logger'
import {
  InvokeToolRequest,
  ListResourcesRequest,
  ListResourcesResponse,
  ListServersRequest,
  ListServersResponse,
  ListToolsRequest,
  ListToolsResponse,
  McpServerConfig,
  RegisterServerResponse,
  UnregisterServerRequest,
  UnregisterServerResponse,
} from 'mcp-hub-api'
import { defineEndpoint, ServiceBoilerplate, ServiceCatalog, SimpleThrottler } from 'service-boilerplate'
import { z } from 'zod'

import { DefaultAdapterFactory } from './adapter'

export class McpHubService extends ServiceBoilerplate {
  private readonly servers = new Map<string, ReturnType<DefaultAdapterFactory['create']>>()
  private readonly factory = new DefaultAdapterFactory()

  constructor(logger: Logger) {
    const catalog = new ServiceCatalog(logger)
    const throttler = new SimpleThrottler(logger, { perMinute: 120, perHour: 2000 })
    super(logger, catalog, throttler)
    this.registerEndpoints(catalog)
  }

  private registerEndpoints(catalog: ServiceCatalog) {
    // registerServer
    catalog.register(
      defineEndpoint('mcp.registerServer', McpServerConfig, RegisterServerResponse, {
        handle: async (cfg: McpServerConfig) => {
          if (this.servers.has(cfg.id)) {
            throw new Error(`Server ${cfg.id} already exists`)
          }
          const adapter = this.factory.create(cfg)
          await adapter.start()
          this.servers.set(cfg.id, adapter)
          return { id: cfg.id }
        },
      }),
    )

    // unregisterServer
    catalog.register(
      defineEndpoint('mcp.unregisterServer', UnregisterServerRequest, UnregisterServerResponse, {
        handle: async (id: string) => {
          const s = this.servers.get(id)
          if (!s) {
            throw new Error(`Server ${id} not found`)
          }
          await s.stop()
          this.servers.delete(id)
          return { id }
        },
      }),
    )

    // listServers
    catalog.register(
      defineEndpoint('mcp.listServers', ListServersRequest, ListServersResponse, {
        handle: async () => ({
          servers: Array.from(this.servers.entries()).map(([id, s]) => ({ serverId: id, running: s.isRunning() })),
        }),
      }),
    )

    // listTools
    catalog.register(
      defineEndpoint('mcp.listTools', ListToolsRequest, ListToolsResponse, {
        handle: async (id: string) => {
          const s = this.must(id)
          return { tools: await s.listTools() }
        },
      }),
    )

    // listResources
    catalog.register(
      defineEndpoint('mcp.listResources', ListResourcesRequest, ListResourcesResponse, {
        handle: async (id: string) => {
          const s = this.must(id)
          return { resources: await s.listResources() }
        },
      }),
    )

    // invokeTool
    catalog.register(
      defineEndpoint('mcp.invokeTool', InvokeToolRequest, z.object({ result: z.unknown() }), {
        handle: async (req: InvokeToolRequest) => {
          const s = this.must(req.serverId)
          const result = await s.invokeTool({ tool: req.tool, params: req.params })
          return { result }
        },
      }),
    )
  }

  private must(id: string) {
    const s = this.servers.get(id)
    if (!s) {
      throw new Error(`Server ${id} not found`)
    }
    return s
  }
}
