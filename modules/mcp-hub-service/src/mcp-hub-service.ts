// modules/mcp-hub-service/src/mcp-hub-service.ts
import { Logger } from 'logger'
import {
  InvokeToolRequest,
  InvokeToolResponse,
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

import { DefaultAdapterFactory, McpServerAdapter } from './adapter'

/**
 * McpHubService provides a registry for Model Context Protocol (MCP) servers.
 *
 * It adheres to the ServiceBoilerplate pattern by validating incoming requests
 * with Zod schemas, executing business logic, and returning type-safe responses.
 */
export class McpHubService extends ServiceBoilerplate {
  private readonly servers = new Map<string, McpServerAdapter>()
  private readonly factory = new DefaultAdapterFactory()

  constructor(logger: Logger) {
    const catalog = new ServiceCatalog(logger)
    const throttler = new SimpleThrottler(logger, { perMinute: 120, perHour: 2000 })
    super(logger, catalog, throttler)
    this.registerEndpoints(catalog)
  }

  private registerEndpoints(catalog: ServiceCatalog): void {
    // registerServer
    catalog.register(
      defineEndpoint('registerServer', McpServerConfig, RegisterServerResponse, {
        handle: async (request: McpServerConfig, context) => {
          this.logger.info(`Processing registerServer request for id: ${request.id}`, { requestId: context?.requestId })

          if (this.servers.has(request.id)) {
            throw new Error(`Server ${request.id} already exists`)
          }

          const adapter = this.factory.create(request)
          await adapter.start()
          this.servers.set(request.id, adapter)

          this.logger.info(`Registered server: ${request.id}`, { requestId: context?.requestId })
          return { id: request.id }
        },
      }),
    )

    // unregisterServer
    catalog.register(
      defineEndpoint('unregisterServer', UnregisterServerRequest, UnregisterServerResponse, {
        handle: async (request: UnregisterServerRequest, context) => {
          const { id } = request
          this.logger.info(`Processing unregisterServer request for id: ${id}`, { requestId: context?.requestId })

          const server = this.servers.get(id)
          if (!server) {
            throw new Error(`Server ${id} not found`)
          }

          await server.stop()
          this.servers.delete(id)

          this.logger.info(`Unregistered server: ${id}`, { requestId: context?.requestId })
          return { id }
        },
      }),
    )

    // listServers
    catalog.register(
      defineEndpoint('listServers', ListServersRequest, ListServersResponse, {
        handle: async (_request: ListServersRequest, context) => {
          this.logger.info('Processing listServers request', { requestId: context?.requestId })
          return {
            servers: Array.from(this.servers.entries()).map(([id, server]) => ({
              serverId: id,
              running: server.isRunning(),
            })),
          }
        },
      }),
    )

    // listTools
    catalog.register(
      defineEndpoint('listTools', ListToolsRequest, ListToolsResponse, {
        handle: async (request: ListToolsRequest, context) => {
          const { id } = request
          this.logger.info(`Processing listTools request for id: ${id}`, { requestId: context?.requestId })

          const server = this.must(id)
          const tools = await server.listTools()
          return { tools }
        },
      }),
    )

    // listResources
    catalog.register(
      defineEndpoint('listResources', ListResourcesRequest, ListResourcesResponse, {
        handle: async (request: ListResourcesRequest, context) => {
          const { id } = request
          this.logger.info(`Processing listResources request for id: ${id}`, { requestId: context?.requestId })

          const server = this.must(id)
          const resources = await server.listResources()
          return { resources }
        },
      }),
    )

    // invokeTool
    catalog.register(
      defineEndpoint('invokeTool', InvokeToolRequest, InvokeToolResponse, {
        handle: async (request: InvokeToolRequest, context) => {
          this.logger.info(`Processing invokeTool request for serverId: ${request.serverId}, tool: ${request.tool}`, {
            requestId: context?.requestId,
          })

          const server = this.must(request.serverId)
          const result = await server.invokeTool({ tool: request.tool, params: request.params })
          return { result }
        },
      }),
    )
  }

  private must(id: string): McpServerAdapter {
    const server = this.servers.get(id)
    if (!server) {
      throw new Error(`Server ${id} not found`)
    }
    return server
  }
}
