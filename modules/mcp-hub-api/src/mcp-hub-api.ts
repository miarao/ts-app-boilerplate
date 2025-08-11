// modules/mcp-hub-api/src/types.ts
import { z } from 'zod'

export type McpTransportKind = 'stdio' | 'http' // extend with 'sse' if you still need it

export const McpServerId = z.string().min(1)
export type McpServerId = z.infer<typeof McpServerId>

export const McpServerIdObject = z.object({ id: McpServerId })
export type McpServerIdObject = z.infer<typeof McpServerIdObject>

export const StdioConfig = z.object({
  kind: z.literal('stdio'),
  cmd: z.string(), // executable path
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
})
export type StdioConfig = z.infer<typeof StdioConfig>

export const HttpConfig = z.object({
  kind: z.literal('http'),
  url: z.string().url(), // Streamable HTTP endpoint, e.g. http://127.0.0.1:7080/mcp
  headers: z.record(z.string()).default({}),
})
export type HttpConfig = z.infer<typeof HttpConfig>

export const McpServerConfig = z.object({
  id: McpServerId,
  name: z.string(),
  version: z.string().default('1.0.0'),
  transport: z.discriminatedUnion('kind', [StdioConfig, HttpConfig]),
})
export type McpServerConfig = z.infer<typeof McpServerConfig>

export const ListServersRequest = z.object({})
export type ListServersRequest = z.infer<typeof ListServersRequest>

export const ListServersResponse = z.object({
  servers: z.array(
    z.object({
      serverId: McpServerId,
      running: z.boolean(),
    }),
  ),
})

export type ListServersResponse = z.infer<typeof ListServersResponse>

export const ListToolsRequest = McpServerIdObject
export type ListToolsRequest = z.infer<typeof ListToolsRequest>

export const RegisterServerResponse = McpServerIdObject
export type RegisterServerResponse = z.infer<typeof RegisterServerResponse>

export const UnregisterServerRequest = McpServerIdObject
export type UnregisterServerRequest = z.infer<typeof UnregisterServerRequest>

export const UnregisterServerResponse = McpServerIdObject
export type UnregisterServerResponse = z.infer<typeof UnregisterServerResponse>

export const ToolListItem = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
})
export type ToolListItem = z.infer<typeof ToolListItem>

export const ListToolsResponse = z.object({
  tools: z.array(ToolListItem),
})
export type ListToolsResponse = z.infer<typeof ListToolsResponse>

export type ResourceListItem = { uri: string; name?: string; description?: string }

export const ListResourcesRequest = McpServerIdObject
export type ListResourcesRequest = z.infer<typeof ListResourcesRequest>

export const ListResourcesResponse = z.object({
  resources: z.array(
    z.object({
      uri: z.string().url(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
    }),
  ),
})
export type ListResourcesResponse = z.infer<typeof ListResourcesResponse>

// tool call
export const InvokeToolRequest = z.object({
  serverId: McpServerId,
  tool: z.string().min(1),
  params: z.unknown().default({}), // validated by the MCP tool itself
})
export type InvokeToolRequest = z.infer<typeof InvokeToolRequest>

export const InvokeToolResponse = z.object({ result: z.unknown() })
export type InvokeToolResponse = z.infer<typeof InvokeToolResponse>
