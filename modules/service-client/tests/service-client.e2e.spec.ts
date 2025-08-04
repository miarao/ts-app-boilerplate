// TODO (om): service client tests should work against service boilerplate rather than executor; maybe use hello-api
describe('services-client-e2e', () => {
  test('foo', async () => {
    expect(5).toEqual(5)
  })
})
// import { createNoOpLogger, Logger } from 'logger'
// import {
//   defineEndpoint,
//   ErrorCodes,
//   Executor,
//   RequestContext,
//   ServiceCatalog,
//   SimpleThrottler,
//   TransportError,
//   ValidationError,
// } from 'service-boilerplate'
// import { z } from 'zod'
//
// import { createClient } from '../src/service-client'
// import { Transport } from '../src/transport'
//
// // Test type definitions
// interface GetUserRequest {
//   id: string
// }
//
// interface GetUserResponse {
//   id: string
//   name: string
//   email: string
// }
//
// interface CreateItemRequest {
//   name: string
//   description?: string
// }
//
// interface CreateItemResponse {
//   id: string
//   created: boolean
// }
//
// describe('End-to-End Flow', () => {
//   // Test state
//   let logger: Logger
//   let catalog: ServiceCatalog
//   let throttler: SimpleThrottler
//   let executor: Executor
//   let lastRequest: { endpointName: string; payload: unknown; context: RequestContext } | null = null
//   let mockTransport: Transport
//   let client: ReturnType<typeof createTestClient>
//
//   // Mock data - fixing the type with Record<string, GetUserResponse>
//   const users: Record<string, GetUserResponse> = {
//     user1: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
//     user2: { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
//   }
//
//   // Create a mock transport that connects directly to our executor
//   function createMockTransport(executor: Executor): Transport {
//     return {
//       async send<Req, Resp>(endpointName: string, payload: Req, options?: { rawMode?: boolean }): Promise<Resp> {
//         const requestId = `test-${Date.now()}`
//         const context: RequestContext = { requestId }
//
//         // Store request for inspection
//         lastRequest = { endpointName, payload, context }
//
//         // Create a properly structured request payload
//         const request = {
//           endpointName,
//           requestData: payload,
//           responseFormat: options?.rawMode ? 'raw' : 'framed',
//         }
//
//         try {
//           // Execute the request through the executor
//           const result = await executor.execute(request, context)
//
//           // If using raw mode, return the result directly
//           if (options?.rawMode) {
//             return result as Resp
//           }
//
//           // Process the framed response
//           const response = result as { status: string; data?: unknown; error?: { code: string; message: string } }
//
//           if (response.status === 'success') {
//             return response.data as Resp
//           } else {
//             // Translate error response to exception
//             const error = response.error!
//             if (error.code === ErrorCodes.VALIDATION_ERROR) {
//               throw new ValidationError(error.message, requestId)
//             } else if (error.code === ErrorCodes.UNKNOWN_ENDPOINT) {
//               throw new Error(`Endpoint not found: ${endpointName}`)
//             } else {
//               throw new TransportError(error.message, requestId)
//             }
//           }
//         } catch (err) {
//           logger.error(`Error in mock transport:`, err)
//           throw err
//         }
//       },
//
//       sendUnawaited<Req>(endpointName: string, payload: Req): void {
//         this.send(endpointName, payload).catch(err => {
//           logger.error(`Error in unwaited request:`, err)
//         })
//       },
//     }
//   }
//
//   // Create a typed client for our test endpoints
//   function createTestClient(transport: Transport) {
//     return createClient(
//       {
//         getUser: (req: GetUserRequest) => Promise.resolve({} as GetUserResponse),
//         createItem: (req: CreateItemRequest) => Promise.resolve({} as CreateItemResponse),
//         throwError: (req: {}) => Promise.resolve({}),
//       },
//       transport,
//     )
//   }
//
//   beforeEach(() => {
//     // Reset test state
//     lastRequest = null
//
//     // Set up dependencies
//     logger = createNoOpLogger()
//     catalog = new ServiceCatalog(logger)
//     throttler = new SimpleThrottler(logger, { perMinute: 100 })
//     executor = new Executor(logger, catalog, throttler)
//
//     // Create mock transport connected to our executor
//     mockTransport = createMockTransport(executor)
//
//     // Create client
//     client = createTestClient(mockTransport)
//
//     // Register test endpoints
//
//     // 1. Get User endpoint
//     catalog.register(
//       defineEndpoint<GetUserRequest, GetUserResponse>(
//         'getUser',
//         z.object({ id: z.string() }),
//         z.object({ id: z.string(), name: z.string(), email: z.string() }),
//         {
//           async handle(request, context) {
//             const user = users[request.id]
//             if (!user) {
//               throw new Error(`User not found: ${request.id}`)
//             }
//             return user
//           },
//         },
//       ),
//     )
//
//     // 2. Create Item endpoint
//     catalog.register(
//       defineEndpoint<CreateItemRequest, CreateItemResponse>(
//         'createItem',
//         z.object({
//           name: z.string().min(3),
//           description: z.string().optional(),
//         }),
//         z.object({ id: z.string(), created: z.boolean() }),
//         {
//           async handle(request, context) {
//             return {
//               id: `item-${Date.now()}`,
//               created: true,
//             }
//           },
//         },
//       ),
//     )
//
//     // 3. Error-throwing endpoint
//     catalog.register(
//       defineEndpoint<{}, {}>('throwError', z.object({}), z.object({}), {
//         async handle(request, context) {
//           throw new Error('Deliberate error for testing')
//         },
//       }),
//     )
//   })
//
//   test('successful request and response flow', async () => {
//     // Execute request through the client
//     const response = await client.getUser({ id: 'user1' })
//
//     // Verify the request was properly passed to the executor
//     expect(lastRequest).not.toBeNull()
//     expect(lastRequest?.endpointName).toBe('getUser')
//     expect(lastRequest?.payload).toEqual({ id: 'user1' })
//
//     // Verify the response came back correctly
//     expect(response).toEqual(users['user1'])
//   })
//
//   test('validation error at request schema level', async () => {
//     // Missing required id field
//     const invalidRequest = {} as GetUserRequest
//
//     // Execute request that will fail validation
//     await expect(client.getUser(invalidRequest)).rejects.toThrow(ValidationError)
//   })
//
//   test('validation error with detailed field validation', async () => {
//     // Name is too short (min length is 3)
//     const invalidRequest = { name: 'ab' } as CreateItemRequest
//
//     // Should fail with validation error
//     await expect(client.createItem(invalidRequest)).rejects.toThrow(/name/)
//   })
//
//   test('error thrown by handler is propagated to client', async () => {
//     // Request for a non-existent user
//     await expect(client.getUser({ id: 'nonexistent' })).rejects.toThrow(/not found/)
//   })
//
//   test('deliberate error endpoint properly propagates error', async () => {
//     await expect(client.throwError({})).rejects.toThrow('Deliberate error for testing')
//   })
//
//   test('can execute multiple sequential requests', async () => {
//     // First request
//     const response1 = await client.getUser({ id: 'user1' })
//     expect(response1).toEqual(users['user1'])
//
//     // Second request
//     const response2 = await client.getUser({ id: 'user2' })
//     expect(response2).toEqual(users['user2'])
//   })
//
//   test('successful request with optional fields', async () => {
//     const request: CreateItemRequest = {
//       name: 'Test Item',
//       description: 'Optional description',
//     }
//
//     const response = await client.createItem(request)
//
//     expect(response.created).toBe(true)
//     expect(response.id).toMatch(/^item-/)
//   })
//   test('rawMode returns raw data and raw errors', async () => {
//     // 1a) raw success
//     const rawUser = await mockTransport.send<GetUserRequest, GetUserResponse>(
//       'getUser',
//       { id: 'user1' },
//       { rawMode: true },
//     )
//     expect(rawUser).toEqual(users['user1'])
//
//     // 1b) raw validation error (missing `id`)
//     await expect(
//       mockTransport.send<GetUserRequest, GetUserResponse>('getUser', {} as any, { rawMode: true }),
//     ).rejects.toBeInstanceOf(ValidationError)
//
//     // 1c) raw internal error → wrapped as TransportError
//     await expect(mockTransport.send<{}, {}>('throwError', {}, { rawMode: true })).rejects.toBeInstanceOf(TransportError)
//   })
//
//   test('unregistered endpoint throws in framed mode', async () => {
//     // No catalog.register for 'noSuch'
//     await expect(mockTransport.send('noSuch', {}, { rawMode: false })).rejects.toThrow('Endpoint not found: noSuch')
//   })
//
//   test('handler-thrown TransportError bubbles through unchanged in framed mode', async () => {
//     // Register an endpoint that throws TransportError
//     catalog.register(
//       defineEndpoint<{}, {}>('transError', z.object({}), z.object({}), {
//         async handle(_, context) {
//           throw new TransportError('trans failure', context.requestId)
//         },
//       }),
//     )
//
//     await expect(mockTransport.send('transError', {}, { rawMode: false })).rejects.toBeInstanceOf(TransportError)
//   })
//
//   test('SimpleThrottler with perMinute=1 only allows one request per minute', async () => {
//     // New executor wired with a 1-request/minute throttler
//     const limitedThrottler = new SimpleThrottler(logger, { perMinute: 1 })
//     const limitedExecutor = new Executor(logger, catalog, limitedThrottler)
//     const limitedTransport = createMockTransport(limitedExecutor)
//
//     // First call succeeds
//     await expect(limitedTransport.send<GetUserRequest, GetUserResponse>('getUser', { id: 'user1' })).resolves.toEqual(
//       users['user1'],
//     )
//
//     // Immediate second call exceeds the limit
//     await expect(limitedTransport.send('getUser', { id: 'user2' })).rejects.toThrow()
//   })
// })
