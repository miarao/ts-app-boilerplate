import { Logger } from 'logger'

import { ApiSchema, BoundEndpoint, UnknownEndpointError } from './primitives'

// Mapped Types for Registries

/**
 * Raw schema registry: maps endpoint keys to their ApiSchema definitions
 * (now using `unknown` instead of `any`)
 */
export type EndpointRegistry<ND extends Record<string, ApiSchema<unknown, unknown>>> = {
  [K in keyof ND]: ND[K]
}

/**
 * Service registry type: maps endpoint keys to fully-bound endpoints
 */
export type ServiceRegistry<ND extends Record<string, ApiSchema<unknown, unknown>>> = {
  [K in keyof ND]: ND[K] extends ApiSchema<infer Req, infer Resp> ? BoundEndpoint<Req, Resp> : never
}

// Runtime Registry
export class ServiceCatalog {
  private catalog: Record<string, BoundEndpoint<unknown, unknown>> = {}

  constructor(private readonly logger: Logger) {}

  /** Register a new endpoint. */
  register<Req, Resp>(endpoint: BoundEndpoint<Req, Resp>): void {
    const name = endpoint.endpointName
    if (this.catalog[name]) {
      this.logger?.error(`Endpoint "${name}" is already registered`)
      throw new Error(`Endpoint "${name}" is already registered`)
    }
    this.logger?.info(`Registered endpoint: ${name}`)
    this.catalog[name] = endpoint
  }

  /** Lookup an endpoint by name. */
  lookup<Req, Resp>(name: string): BoundEndpoint<Req, Resp> {
    const endpoint = this.catalog[name]
    if (!endpoint) {
      this.logger?.error(`Endpoint not found: ${name}`)
      throw new UnknownEndpointError(name)
    }
    this.logger?.debug(`Found endpoint: ${name}`)
    return endpoint as BoundEndpoint<Req, Resp>
  }

  /** List all registered endpoint names. */
  list(): string[] {
    return Object.keys(this.catalog)
  }
}
