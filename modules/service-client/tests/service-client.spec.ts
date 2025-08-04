import axios, { AxiosInstance } from 'axios'
import { createNoOpLogger } from 'logger'
import { Transport } from 'transport'

import { createClient, HttpTransport } from '../src'

jest.mock('axios')

describe('service client', () => {
  // Mock axios properly
  const mockedAxios = axios as jest.Mocked<typeof axios>
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
  } as unknown as jest.Mocked<AxiosInstance>

  describe('HttpTransport', () => {
    let transport: HttpTransport

    beforeEach(() => {
      jest.clearAllMocks()
      // Set up the creation mock to return our mocked instance
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance)
      transport = new HttpTransport(createNoOpLogger())
    })

    test('send should make POST request and return response data', async () => {
      const mockResponse = { data: { result: 'success' } }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await transport.send('testEndpoint', { foo: 'bar' })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/testEndpoint', { foo: 'bar' }, { params: undefined })
      expect(result).toEqual(mockResponse.data)
    })

    test('send should include rawMode parameter when specified', async () => {
      const mockResponse = { data: 'raw data' }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      await transport.send('testEndpoint', { foo: 'bar' }, { rawMode: true })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/testEndpoint',
        { foo: 'bar' },
        { params: { rawMode: true } },
      )
    })

    test('sendUnawaited should make POST request without waiting for response', () => {
      mockAxiosInstance.post.mockResolvedValue({})

      transport.sendUnawaited('testEndpoint', { foo: 'bar' })

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/testEndpoint', { foo: 'bar' })
    })

    test('sendUnawaited should catch and log errors', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.post.mockRejectedValue(mockError)

      // Create a transport with a logger we can spy on
      const mockLogger = createNoOpLogger()
      jest.spyOn(mockLogger, 'error')
      const transportWithSpy = new HttpTransport(mockLogger)

      transportWithSpy.sendUnawaited('testEndpoint', { foo: 'bar' })

      // Wait for the promise rejection to be caught
      await new Promise(process.nextTick)

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in unwaited request to testEndpoint'),
        mockError,
      )
    })

    test('send should reject when axios.post throws', async () => {
      const networkErr = new Error('network down')
      mockAxiosInstance.post.mockRejectedValueOnce(networkErr)

      await expect(transport.send('broken', { x: 1 })).rejects.toBe(networkErr)
    })

    // 2) ensure axios.create() is actually used in the constructor
    test('constructor should call axios.create exactly once', () => {
      expect(mockedAxios.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('createClient', () => {
    // Create a mock transport
    const mockTransport: Transport = {
      send: jest.fn().mockImplementation((endpoint, payload) => Promise.resolve({ endpoint, payload })),
      sendUnawaited: jest.fn(),
    }

    test('should map catalog functions to transport.send calls', async () => {
      // Define a catalog of endpoint handlers
      const catalog = {
        getUser: (req: { id: string }) => Promise.resolve({ name: 'User', id: req.id }),
        createItem: (req: { name: string }) => Promise.resolve({ id: '123', name: req.name }),
      }

      // Create client from catalog and mock transport
      const client = createClient(catalog, mockTransport)

      // Test that client methods properly call transport.send
      const getUserResult = await client.getUser({ id: '123' })
      expect(mockTransport.send).toHaveBeenCalledWith('getUser', { id: '123' })
      expect(getUserResult).toEqual({ endpoint: 'getUser', payload: { id: '123' } })

      const createItemResult = await client.createItem({ name: 'Item 1' })
      expect(mockTransport.send).toHaveBeenCalledWith('createItem', { name: 'Item 1' })
      expect(createItemResult).toEqual({ endpoint: 'createItem', payload: { name: 'Item 1' } })
    })

    test('should preserve all catalog keys in the client', () => {
      const catalog = {
        endpoint1: () => Promise.resolve({}),
        endpoint2: () => Promise.resolve({}),
        endpoint3: () => Promise.resolve({}),
      }

      const client = createClient(catalog, mockTransport)

      // Verify all endpoints were mapped
      expect(Object.keys(client)).toEqual(['endpoint1', 'endpoint2', 'endpoint3'])
    })
  })
})
