import { Logger } from 'logger'
import { Instant } from 'misc'
import { ErrorCodes, formatZodError, RequestContext, RequestPayload, ResponseFrame } from 'service-primitives'
import { RateLimiter } from 'service-rate-limiter'
import { ServiceCatalog, ServiceRouter } from 'service-router'

export class ServiceBoilerplate {
  private readonly router: ServiceRouter<unknown, unknown>
  constructor(
    readonly logger: Logger,
    readonly clock: Instant,
    private readonly catalog: ServiceCatalog<unknown, unknown>,
    private readonly rateLimiter?: RateLimiter,
  ) {
    this.router = new ServiceRouter(logger, this.catalog)
  }

  private readonly handler = async (rawPayload: unknown, rawContext: unknown | undefined) => {
    const parsedCtx = RequestContext.safeParse(rawContext)
    if (!parsedCtx.success) {
      this.logger.error(
        `could not parse ${JSON.stringify(rawContext)}`,
        formatZodError(JSON.stringify(parsedCtx.error)),
      )
      // Unknown desired format → always framed
      return ResponseFrame.parse({
        status: 'error',
        // TODO (om): attach requestId anyway?
        requestId: typeof parsedCtx === 'object' && 'requestId' in parsedCtx ? parsedCtx.requestId : 'unknown',
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: formatZodError(parsedCtx.error),
        },
      })
    }

    const context = parsedCtx.data

    // TODO (om): should be first call - context is currently unused by throttler
    this.logger.debug(`Applying throttling`)
    if (this.rateLimiter) {
      await this.rateLimiter.throttle(undefined)
    }

    this.logger.info(`Processing request ${context.requestId}`)

    const parsed = RequestPayload.safeParse(rawPayload)
    if (!parsed.success) {
      this.logger.error(`Payload validation failed`, formatZodError(parsed.error))
      // Unknown desired format → always framed
      return ResponseFrame.parse({
        status: 'error',
        requestId: context.requestId,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: formatZodError(parsed.error),
        },
      })
    }

    // TODO (om): better handling - executor should return some sort of constant indicator
    //  "fulfilled" / "failed" and processed prior to return from service
    //  maybe something like type ExecutionOutcome:
    //  { result: "fulfilled", data: <parsed response> } | { result: "failed", error: <structured error> },
    //  executor should not throw
    return await this.router.route(parsed.data, context)
  }

  getHandler(): (input: unknown, context?: unknown) => Promise<unknown> {
    return this.handler
  }
}
