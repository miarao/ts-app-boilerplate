import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import { createDefaultLogger, Logger } from 'logger'
import { makeId } from 'misc'
import { HttpMethod, ServiceBoilerplate } from 'service-boilerplate'
import { z } from 'zod'

/**
 * Services Local - Express server that maintains a registry of services and routes requests to them
 */

// RequestContext only requires requestId, everything else is arbitrary
const RequestContextSchema = z
  .object({
    requestId: z.string().optional(),
  })
  .catchall(z.unknown())
type RequestContext = z.infer<typeof RequestContextSchema> & { requestId: string; res?: Response }

// Request payload schema
const InvokeRequestSchema = z.object({
  serviceName: z.string(),
  request: z.unknown(),
  context: RequestContextSchema.optional(),
})
type InvokeRequest = z.infer<typeof InvokeRequestSchema>

// Response structure
interface ServiceResponse {
  status: 'success' | 'error'
  requestId: string
  data?: unknown
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * ServicesLocal creates and manages a registry of ServiceBoilerplate instances
 * and provides an Express server to handle client requests
 */
export class ServicesLocal {
  private services: Map<string, ServiceBoilerplate> = new Map()
  private app = express()
  private logger: Logger
  private readonly port: number

  constructor(port: number = 1404, logger: Logger = createDefaultLogger('info')) {
    this.app.use(
      // Added cors for all origins (change on prod)
      // TODO (om): NON-PROD ONLY!
      cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
        exposedHeaders: ['X-Request-Id'],
        credentials: false,
        maxAge: 86400,
      }),
    )
    this.port = port
    this.logger = logger
    this.mountServer()
  }

  /**
   * Register a service with a unique name
   */
  registerService(name: string, service: ServiceBoilerplate): void {
    if (this.services.has(name)) {
      this.logger.error(`Service with name '${name}' is already registered`)
      throw new Error(`Service with name '${name}' is already registered`)
    }

    this.services.set(name, service)
    this.logger.info(`Registered service: ${name}`)
  }

  /**
   * Get a service by name
   */
  getService(name: string): ServiceBoilerplate | undefined {
    return this.services.get(name)
  }

  /**
   * List all registered service names
   */
  listServices(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * Configure Express middleware and routes
   */
  private mountServer(): void {
    this.app.use(express.json())

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        services: this.listServices(),
      })
    })

    // Main service invocation endpoint
    this.app.post('/invoke', (req: Request, res: Response, next: NextFunction) => {
      const handleInvoke = async () => {
        try {
          const parseResult = InvokeRequestSchema.safeParse(req.body)

          if (!parseResult.success) {
            const errorResponse: ServiceResponse = {
              status: 'error',
              requestId: makeId(),
              error: {
                code: 'validation_error',
                message: `Invalid request payload. received request: ${JSON.stringify(req)}`,
                details: parseResult.error.format(),
              },
            }
            return res.status(400).json(errorResponse)
          }

          const { serviceName, request, context: rawContext } = parseResult.data

          // Ensure we have a requestId by either:
          // 1. Using one provided in the context
          // 2. Using x-request-id header
          // 3. Generating a new UUID
          const requestId =
            rawContext && 'requestId' in rawContext && typeof rawContext.requestId === 'string'
              ? rawContext.requestId
              : (req.headers['x-request-id'] as string) || makeId()

          // Create the request context with the requestId and any other provided context properties
          const requestContext: RequestContext = {
            ...(rawContext || {}),
            requestId,
            // Add HTTP context if not provided
            http:
              rawContext && 'http' in rawContext
                ? rawContext.http
                : {
                    headers: req.headers as Record<string, string>,
                    method: req.method as HttpMethod,
                    path: req.path,
                    query: req.query as Record<string, string | string[]>,
                    params: req.params,
                  },
          }

          // Get the service handler
          const service = this.services.get(serviceName)
          if (!service) {
            const errorResponse: ServiceResponse = {
              status: 'error',
              requestId: requestContext.requestId,
              error: {
                code: 'unknown_service',
                message: `Service '${serviceName}' not found`,
              },
            }
            this.logger.error(`Service not found: ${serviceName}`)
            return res.status(404).json(errorResponse)
          }

          this.logger.info(`Handling request for service: ${serviceName}`, { requestId: requestContext.requestId })

          // Get the service handler and invoke it
          const handler = service.getHandler()
          const result = await handler(request, requestContext)

          // If the result already has a proper structure, return it directly
          if (result && typeof result === 'object' && 'status' in result) {
            return res.json(result)
          }

          // Otherwise, wrap the result in a standard response
          const successResponse: ServiceResponse = {
            status: 'success',
            requestId: requestContext.requestId,
            data: result,
          }

          return res.json(successResponse)
        } catch (error) {
          this.logger.error(`Error handling request for service:`, error)

          // Format the error response
          const errorResponse: ServiceResponse = {
            status: 'error',
            requestId: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : makeId(),
            error: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              code: error instanceof Error && 'code' in error ? (error as any).code : 'internal_error',
              message: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          }

          return res.status(500).json(errorResponse)
        }
      }

      // Execute the async handler and catch any errors
      handleInvoke().catch(next)
    })

    // Error handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unexpected server error', err)
      res.status(500).json({
        status: 'error',
        requestId: (req.headers['x-request-id'] as string) || makeId(),
        error: {
          code: 'internal_server_error',
          message: 'An unexpected error occurred',
        },
      })
    })
  }

  /**
   * Start the Express server
   */
  async start(): Promise<void> {
    return new Promise(resolve => {
      this.app.listen(this.port, () => {
        this.logger.info(`🚀 Services Local server running at http://localhost:${this.port}`)
        this.logger.info(`Registered services: ${this.listServices().join(', ') || 'none'}`)
        resolve()
      })
    })
  }

  /**
   * Stop the server (for testing or clean shutdown)
   */
  async stop(): Promise<void> {
    // Implementation depends on the HTTP server instance, but we'll leave it as a stub
    this.logger.info('Stopping Services Local server')
    return Promise.resolve()
  }
}
