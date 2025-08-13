import { z, ZodType } from 'zod'

import { Handler } from './handler'

export const RequestPayload = z.object({
  endpointName: z.string(),
  responseFormat: z.enum(['framed', 'raw']),
  requestData: z.unknown(),
})
export type RequestPayload = z.infer<typeof RequestPayload>

export const ResponseFormat = z.union([z.literal('framed'), z.literal('raw')])
export type ResponseFormat = z.infer<typeof ResponseFormat>

export const ResponseFrame = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    requestId: z.string().optional(),
    data: z.unknown(),
  }),
  z.object({
    status: z.literal('error'),
    requestId: z.string().optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
])
export type ResponseFrame = z.infer<typeof ResponseFrame>

//
// Error Codes & Formatting
//

/**
 * The “API contract” — just your request/response schemas
 */
export interface ApiSchema<Req, Resp> {
  /** Zod schema that will parse & validate the raw `requestData` → `Req` */
  requestSchema: ZodType<Req>
  /** Zod schema that will validate the handler’s `Resp` before framing/return */
  responseSchema: ZodType<Resp>
}

/**
 * A fully-bound endpoint: name + schemas + handler implementation
 */
export interface BoundEndpoint<Req, Resp> extends ApiSchema<Req, Resp> {
  /** unique key by which this endpoint is looked up in the registry */
  endpointName: string
  /** the business logic for this endpoint */
  handler: Handler<Req, Resp>
}
