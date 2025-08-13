import { Logger } from 'logger'
import { BoundEndpoint, UnknownEndpointError } from 'service-primitives'

export class ServiceCatalog<Req, Resp> {
  private catalog: Record<string, BoundEndpoint<Req, Resp>> = {}

  constructor(private readonly logger: Logger) {}

  /** Register a new endpoint. */
  register(endpoint: BoundEndpoint<Req, Resp>): void {
    const name = endpoint.endpointName
    if (this.catalog[name]) {
      this.logger.info(`Endpoint "${name}" is already registered`)
      return
    }
    this.logger?.info(`Registered endpoint: ${name}`)
    this.catalog[name] = endpoint
  }

  /** Lookup an endpoint by name. */
  lookup(name: string):
    | {
        resolved: true
        endpoint: BoundEndpoint<Req, Resp>
      }
    | {
        resolved: false
        error: UnknownEndpointError
      } {
    const endpoint = this.catalog[name]
    if (!endpoint) {
      this.logger?.error(`Endpoint not found: ${name}`)
      return { resolved: false, error: new UnknownEndpointError(name) }
    }
    this.logger?.debug(`Found endpoint: ${name}`)
    return { resolved: true, endpoint: endpoint satisfies BoundEndpoint<Req, Resp> }
  }

  /** List all registered endpoint names. */
  list(): string[] {
    return Object.keys(this.catalog)
  }
}
