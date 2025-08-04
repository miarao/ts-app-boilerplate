import { createNoOpLogger, Logger } from 'logger'
import { z } from 'zod'

import { Executor, RequestPayload } from '../src'
import { RequestContext } from '../src'
import { ServiceCatalog } from '../src'
import { ErrorCodes, TransportError, UnknownEndpointError, ValidationError } from '../src/primitives'

describe('Executor', () => {
  // Mock dependencies
  let mockLogger: Logger
  let mockCatalog: jest.Mocked<ServiceCatalog>
  let executor: Executor
  let testContext: RequestContext

  beforeEach(() => {
    // Setup mocks
    mockLogger = createNoOpLogger()
    jest.spyOn(mockLogger, 'info')
    jest.spyOn(mockLogger, 'debug')
    jest.spyOn(mockLogger, 'error')

    mockCatalog = {
      lookup: jest.fn(),
      register: jest.fn(),
      list: jest.fn(),
    } as unknown as jest.Mocked<ServiceCatalog>

    // Create executor instance
    executor = new Executor(mockLogger, mockCatalog)

    // Standard test request context
    testContext = {
      requestId: 'test-req-123',
    }
  })

  test('should handle unknown endpoint in framed mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'nonExistentEndpoint',
      requestData: {},
      responseFormat: 'framed',
    }

    // Simulate unknown endpoint
    mockCatalog.lookup.mockImplementation(() => {
      throw new UnknownEndpointError('nonExistentEndpoint')
    })

    const result = await executor.execute(payload, testContext)

    // Should return framed error response
    expect(result).toMatchObject({
      status: 'error',
      requestId: 'test-req-123',
      error: {
        code: ErrorCodes.UNKNOWN_ENDPOINT,
      },
    })
  })

  test('should throw for unknown endpoint in raw mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'nonExistentEndpoint',
      requestData: {},
      responseFormat: 'raw',
    }

    // Simulate unknown endpoint
    mockCatalog.lookup.mockImplementation(() => {
      throw new UnknownEndpointError('nonExistentEndpoint')
    })

    await expect(executor.execute(payload, testContext)).rejects.toThrow(UnknownEndpointError)
  })

  test('should validate request data against endpoint schema', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { wrongField: 'value' }, // Invalid data for schema
      responseFormat: 'framed',
    }

    // Setup mock endpoint with schema
    const mockEndpoint = {
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }), // Requires 'id' field
      responseSchema: z.object({ result: z.string() }),
      handler: {
        handle: jest.fn(),
      },
    }
    mockCatalog.lookup.mockReturnValue(mockEndpoint)

    const result = await executor.execute(payload, testContext)

    // Should return validation error
    expect(result).toMatchObject({
      status: 'error',
      requestId: 'test-req-123',
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
      },
    })
    // Handler should not be called
    expect(mockEndpoint.handler.handle).not.toHaveBeenCalled()
  })

  test('should handle successful request in framed mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { id: '123' },
      responseFormat: 'framed',
    }

    // Valid response data
    const responseData = { result: 'success' }

    // Setup mock endpoint
    const mockEndpoint = {
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.object({ result: z.string() }),
      handler: {
        handle: jest.fn().mockResolvedValue(responseData),
      },
    }
    mockCatalog.lookup.mockReturnValue(mockEndpoint)

    const result = await executor.execute(payload, testContext)

    // Verify handler was called with validated data
    expect(mockEndpoint.handler.handle).toHaveBeenCalledWith({ id: '123' }, testContext)

    // Should return framed success response
    expect(result).toMatchObject({
      status: 'success',
      requestId: 'test-req-123',
      data: responseData, // Changed from responseData to data
    })
  })

  test('should return raw response in raw mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { id: '123' },
      responseFormat: 'raw',
    }

    // Response data
    const responseData = { result: 'success' }

    // Setup mock endpoint
    const mockEndpoint = {
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.object({ result: z.string() }),
      handler: {
        handle: jest.fn().mockResolvedValue(responseData),
      },
    }
    mockCatalog.lookup.mockReturnValue(mockEndpoint)

    const result = await executor.execute(payload, testContext)

    // Should return raw result directly
    expect(result).toEqual(responseData)
  })

  test('should handle handler errors in framed mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { id: '123' },
      responseFormat: 'framed',
    }

    // Setup mock endpoint with handler that throws error
    const mockError = new Error('Handler failed')
    const mockEndpoint = {
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.object({ result: z.string() }),
      handler: {
        handle: jest.fn().mockRejectedValue(mockError),
      },
    }
    mockCatalog.lookup.mockReturnValue(mockEndpoint)

    const result = await executor.execute(payload, testContext)

    // Should return framed error response
    expect(result).toMatchObject({
      status: 'error',
      requestId: 'test-req-123',
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Handler failed',
      },
    })
  })

  test('should handle handler validation errors', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { id: '123' },
      responseFormat: 'framed',
    }

    // Setup mock endpoint with handler that throws validation error
    const validationError = new ValidationError('Invalid response data', 'test-req-123')
    const mockEndpoint = {
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.object({ result: z.string() }),
      handler: {
        handle: jest.fn().mockRejectedValue(validationError),
      },
    }
    mockCatalog.lookup.mockReturnValue(mockEndpoint)

    const result = await executor.execute(payload, testContext)

    // Should return specific validation error
    expect(result).toMatchObject({
      status: 'error',
      requestId: 'test-req-123',
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid response data',
      },
    })
  })

  test('should re-throw TransportError from handler even in framed mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { id: '123' },
      responseFormat: 'framed',
    }

    const te = new TransportError('transport failed', 'test-req-123', new Error('net'))
    mockCatalog.lookup.mockReturnValue({
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.any(),
      handler: { handle: jest.fn().mockRejectedValue(te) },
    })

    await expect(executor.execute(payload, testContext)).rejects.toBe(te)
  })

  test('should wrap generic handler errors as TransportError in raw mode', async () => {
    const payload: RequestPayload = {
      endpointName: 'testEndpoint',
      requestData: { id: '123' },
      responseFormat: 'raw',
    }

    const err = new Error('boom')
    mockCatalog.lookup.mockReturnValue({
      endpointName: 'testEndpoint',
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.any(),
      handler: { handle: jest.fn().mockRejectedValue(err) },
    })

    await expect(executor.execute(payload, testContext)).rejects.toBeInstanceOf(TransportError)
  })

  test('should re-throw non-UnknownEndpoint errors from lookup', async () => {
    const payload: RequestPayload = {
      endpointName: 'willFailLookup',
      requestData: { id: '1' },
      responseFormat: 'framed',
    }

    mockCatalog.lookup.mockImplementation(() => {
      throw new Error('lookup catastrophe')
    })

    await expect(executor.execute(payload, testContext)).rejects.toThrow('lookup catastrophe')
  })
})
