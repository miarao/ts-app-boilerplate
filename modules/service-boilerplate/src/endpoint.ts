import { ZodType } from 'zod'

import { Handler } from './handler'
import { BoundEndpoint } from './primitives'

/**
 * Define a new endpoint by tying together:
 *  - a unique name
 *  - a Zod request schema
 *  - a Zod response schema
 *  - the business-logic handler
 */
export function defineEndpoint<Req, Resp>(
  endpointName: string,
  requestSchema: ZodType<Req>,
  responseSchema: ZodType<Resp>,
  handler: Handler<Req, Resp>,
): BoundEndpoint<Req, Resp> {
  // Wrap handler, validate its output immediately
  const validatedHandler: Handler<Req, Resp> = {
    async handle(req, ctx) {
      const result = await handler.handle(req, ctx)
      responseSchema.parse(result) // throws ZodError (caught later as ValidationError)
      return result
    },
  }

  return {
    endpointName,
    requestSchema,
    responseSchema,
    handler: validatedHandler,
  }
}
