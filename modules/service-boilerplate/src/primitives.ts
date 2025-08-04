import { z, ZodError, ZodType } from 'zod'

import { Handler } from './handler'

//
// Request/Response Schemas
//

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

export const ErrorCodes = {
  VALIDATION_ERROR: 'validation_error',
  UNKNOWN_ENDPOINT: 'unknown_endpoint',
  INTERNAL_ERROR: 'internal_error',
  TRANSPORT_ERROR: 'transport_error',
} as const

export function formatZodError(error: unknown): string {
  if (!(error instanceof ZodError)) {
    return String(error)
  }
  const formatted = error.errors.map(issue => {
    const path = issue.path.length ? `at '${issue.path.join('.')}' ` : ''
    return `${path}${issue.message}`
  })
  return formatted.length ? `Validation failed:\n- ${formatted.join('\n- ')}` : 'Validation failed with no details'
}

//
// ServiceError Hierarchy
//

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ServiceError'
    Object.setPrototypeOf(this, ServiceError.prototype)
  }

  toString() {
    return `ServiceError [${this.code}]${this.requestId ? ` (req ${this.requestId})` : ''}: ${this.message}`
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, requestId?: string, cause?: unknown) {
    super(ErrorCodes.VALIDATION_ERROR, message, requestId, cause)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class UnknownEndpointError extends ServiceError {
  constructor(endpointName: string, requestId?: string) {
    super(ErrorCodes.UNKNOWN_ENDPOINT, `Endpoint '${endpointName}' not found`, requestId)
    this.name = 'UnknownEndpointError'
    Object.setPrototypeOf(this, UnknownEndpointError.prototype)
  }
}

export class TransportError extends ServiceError {
  constructor(message: string, requestId?: string, cause?: unknown) {
    super(ErrorCodes.TRANSPORT_ERROR, message, requestId, cause)
    this.name = 'TransportError'
    Object.setPrototypeOf(this, TransportError.prototype)
  }
}

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
