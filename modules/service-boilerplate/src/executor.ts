import { Logger } from 'logger'
import { errorLike } from 'misc'

import type { RequestContext } from './handler'
import {
  ErrorCodes,
  formatZodError,
  RequestPayload,
  ResponseFrame,
  TransportError,
  UnknownEndpointError,
  ValidationError,
} from './primitives'
import { ServiceCatalog } from './service-catalog'

/**
 * Executes a request end-to-end:
 * 1. Parses the incoming payload (figures out framed vs raw)
 * 2. Applies throttling
 * 3. Looks up the endpoint (or throws UnknownEndpointError)
 * 4. Validates requestData via Zod
 * 5. Invokes the handler
 * 6. Returns either the raw result/error or a framed ResponseFrame
 */
export class Executor {
  constructor(private readonly logger: Logger, private readonly catalog: ServiceCatalog) {}

  async execute(payload: RequestPayload, context: RequestContext): Promise<unknown> {
    const { endpointName, requestData, responseFormat } = payload
    this.logger.debug(`Request for endpoint: ${endpointName}`, { responseFormat })

    let endpoint
    try {
      this.logger.debug(`Looking up endpoint: ${endpointName}`)
      endpoint = this.catalog.lookup(endpointName)
    } catch (err: unknown) {
      if (err instanceof UnknownEndpointError) {
        this.logger.error(`Unknown endpoint: ${endpointName}`, err.message)
        if (responseFormat === 'raw') {
          throw err
        }
        return ResponseFrame.parse({
          status: 'error',
          requestId: context.requestId,
          error: { code: err.code, message: err.message },
        })
      }
      this.logger.error(`Unexpected error looking up endpoint: ${endpointName}`, err)
      throw err
    }

    this.logger.debug(`Validating request data for ${endpointName}`)
    const reqParsed = endpoint.requestSchema.safeParse(requestData)
    if (!reqParsed.success) {
      const message = formatZodError(reqParsed.error)
      this.logger.error(`Request validation failed for ${endpointName}`, { message })
      if (responseFormat === 'raw') {
        throw new ValidationError(message, context.requestId, reqParsed.error)
      }
      return ResponseFrame.parse({
        status: 'error',
        requestId: context.requestId,
        error: { code: ErrorCodes.VALIDATION_ERROR, message },
      })
    }

    try {
      this.logger.info(`Executing handler for ${endpointName}`)
      const result = await endpoint.handler.handle(reqParsed.data, context)

      const parsedResponse = endpoint.responseSchema.safeParse(result)

      if (!parsedResponse.success) {
        throw new ValidationError(
          `failed to parse response of ${endpointName} received: ${JSON.stringify(parsedResponse.data)}`,
        )
      }

      const data = parsedResponse.data

      if (responseFormat === 'raw') {
        this.logger.debug(`Handler for ${endpointName} completed successfully, returning raw response`)
        return data
      }

      this.logger.info(`Returning framed success response for ${endpointName}`)
      return ResponseFrame.parse({
        status: 'success',
        requestId: context.requestId,
        data,
      })
    } catch (err: unknown) {
      // a) service‐level validation errors
      if (err instanceof ValidationError) {
        this.logger.error(`Validation error in handler for ${endpointName}`, err)
        if (responseFormat === 'raw') {
          throw err
        }
        return ResponseFrame.parse({
          status: 'error',
          requestId: context.requestId,
          error: { code: err.code, message: err.message },
        })
      }

      // b) transport-level errors must bubble up
      if (err instanceof TransportError) {
        this.logger.error(`Transport error in handler for ${endpointName}`, err)
        throw err
      }

      // c) everything else → internal error
      const message = errorLike(err).message ?? 'unknown error'
      if (responseFormat === 'raw') {
        this.logger.error(`Internal error in handler for ${endpointName}`, err)
        throw new TransportError(message, context.requestId, err)
      }
      return ResponseFrame.parse({
        status: 'error',
        requestId: context.requestId,
        error: { code: ErrorCodes.INTERNAL_ERROR, message },
      })
    }
  }
}
