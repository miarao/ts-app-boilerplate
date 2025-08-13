import { AxiosRequestConfig } from 'axios'
import { RequestPayload, ResponseFormat, ResponseFrame } from 'service-primitives'

import { APIClient, createApiClient } from './client'

// Define the structure expected by the /invoke endpoint
export interface InvokeParams<RQ = unknown> {
  serviceName: string
  request: RequestPayload & {
    requestData: RQ
  }
}

export type RequestConfig = AxiosRequestConfig

/**
 * Interface for internal API client functionality
 */
export interface InternalAPIClient {
  /**
   * Invokes a service endpoint through the /invoke API with strong typing
   *
   * @param params The service and request parameters
   * @param config Optional request config
   * @returns A promise resolving to the service response
   */
  invoke<RQ = unknown, RS = unknown>(
    params: InvokeParams<RQ>,
    config?: RequestConfig,
  ): Promise<ResponseFrame & { data?: RS }>

  /**
   * Type-safe helper method to create a strongly-typed request
   *
   * @param serviceName The name of the service to invoke
   * @param endpointName The name of the endpoint to call
   * @param requestData The data to send to the endpoint
   * @param responseFormat The desired response format (framed or raw)
   * @param config Optional request config
   * @returns A promise resolving to the service response
   */
  callEndpoint<RQ = unknown, RS = unknown>(
    serviceName: string,
    endpointName: string,
    requestData: RQ,
    responseFormat?: ResponseFormat,
    config?: RequestConfig,
  ): Promise<ResponseFrame & { data?: RS }>
}

/**
 * Implementation of InternalAPIClient using Axios
 */
class InternalAxiosClient implements InternalAPIClient {
  private apiClient: APIClient

  constructor(baseURL: string) {
    this.apiClient = createApiClient(baseURL)
  }

  async invoke<RQ = unknown, RS = unknown>(
    params: InvokeParams<RQ>,
    config?: AxiosRequestConfig,
  ): Promise<ResponseFrame & { data?: RS }> {
    return this.apiClient.post<InvokeParams<RQ>, ResponseFrame & { data?: RS }>('/invoke', params, config)
  }

  async callEndpoint<RQ = unknown, RS = unknown>(
    serviceName: string,
    endpointName: string,
    requestData: RQ,
    responseFormat: ResponseFormat = 'framed',
    config?: AxiosRequestConfig,
  ): Promise<ResponseFrame & { data?: RS }> {
    return this.invoke<RQ, RS>(
      {
        serviceName,
        request: {
          endpointName,
          responseFormat,
          requestData,
        },
      },
      config,
    )
  }
}

/**
 * Creates an instance of InternalAPIClient
 *
 * @param baseURL Optional base URL (defaults to http://localhost:7077)
 * @returns An InternalAPIClient instance
 */
export function createInternalApiClient(baseURL: string = 'http://localhost:7077'): InternalAPIClient {
  return new InternalAxiosClient(baseURL)
}
