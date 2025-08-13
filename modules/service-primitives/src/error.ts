import { ZodError } from 'zod'

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

export class InternalError extends ServiceError {
  constructor(message: string, requestId?: string, cause?: unknown) {
    super(ErrorCodes.TRANSPORT_ERROR, message, requestId, cause)
    this.name = 'INTERNAL_ERROR'
    Object.setPrototypeOf(this, TransportError.prototype)
  }
}
