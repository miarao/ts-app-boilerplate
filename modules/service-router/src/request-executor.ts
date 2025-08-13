import { Logger } from 'logger'
import { errorLike } from 'misc'
import { BoundEndpoint, InternalError, TransportError, ValidationError } from 'service-primitives'

/**
 * Executes a valid request end-to-end:
 * - Invokes the handler
 * - Returns either the raw result/error or a framed ResponseFrame
 */
export class RequestExecutor<Req, Resp> {
  constructor(private readonly logger: Logger) {}

  async execute(endpoint: BoundEndpoint<Req, Resp>, requestData: Req, requestId: string): Promise<Resp> {
    const endpointName = endpoint.endpointName
    try {
      this.logger.info(`Executing handler for ${endpointName}`)
      const result = await endpoint.handler.handle(requestData, { requestId })

      const parsedResponse = endpoint.responseSchema.safeParse(result)

      if (!parsedResponse.success) {
        throw new ValidationError(
          `failed to parse response of ${endpointName} received: ${JSON.stringify(parsedResponse.data)}`,
        )
      }

      return parsedResponse.data
    } catch (err: unknown) {
      // transport layer error
      if (err instanceof TransportError) {
        this.logger.error(`request ${requestId} transport error in handler for ${endpointName}`, err)
        throw err
      }

      // response validation error
      if (err instanceof ValidationError) {
        this.logger.error(`request ${requestId} RESPONSE validation error in for ${endpointName}`, err)
        throw err
      }

      // everything else → internal error
      const message = errorLike(err).message ?? 'unknown error'
      this.logger.error(`request ${requestId} Internal error in handler for ${endpointName}`, err)
      throw new InternalError(message, requestId, err)
    }
  }
}
