import { Logger } from 'logger'
import { BoundEndpoint, formatZodError, RequestContext, RequestPayload, ValidationError } from 'service-primitives'

import { RequestExecutor } from './request-executor'
import { ServiceCatalog } from './service-catalog'

export class ServiceRouter<Req, Resp> {
  private readonly executor: RequestExecutor<Req, Resp>
  constructor(private readonly logger: Logger, private readonly catalog: ServiceCatalog<Req, Resp>) {
    this.executor = new RequestExecutor(logger)
  }

  async route(payload: RequestPayload, context: RequestContext): Promise<unknown> {
    const { endpointName, requestData } = payload
    this.logger.debug(`Request for endpoint: ${endpointName}`, { requestId: context.requestId })
    let endpoint, parsedData
    try {
      endpoint = await this.resolveEndpoint(endpointName)
      this.logger.debug(`Resolved endpoint: ${endpointName}, moving to validating request data`)
      parsedData = await this.handleRequestData(endpoint, requestData, context.requestId)
    } catch (e) {
      this.logger.error(`failed to resolve endpoint, looked for: ${endpointName}. requestId: ${context.requestId}`, e)
      throw e
    }
    return this.executor.execute(endpoint, parsedData, context.requestId)
  }

  private resolveEndpoint(endpointName: string): Promise<BoundEndpoint<Req, Resp>> {
    this.logger.debug(`Looking up endpoint: ${endpointName}`)
    const lookupResult = this.catalog.lookup(endpointName)
    if (!lookupResult.resolved) {
      throw lookupResult.error
    }
    return Promise.resolve(lookupResult.endpoint)
  }

  private async handleRequestData(endpoint: BoundEndpoint<Req, Resp>, requestData: unknown, requestId: string) {
    const parsedRequest = endpoint.requestSchema.safeParse(requestData)
    if (!parsedRequest.success) {
      const message = `request ${requestId} REQUEST validation failed for ${endpoint.endpointName}: ${formatZodError(
        parsedRequest.error,
      )}`
      throw new ValidationError(message, undefined, parsedRequest.error.message)
    }

    return Promise.resolve(parsedRequest.data satisfies Req)
  }
}
