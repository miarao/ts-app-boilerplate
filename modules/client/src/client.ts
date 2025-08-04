import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import isURL from 'validator/lib/isURL'

const urlOptions = {
  protocols: ['http', 'https'],
  require_protocol: true, // force “http://” or “https://”
  require_tld: false, // allow “localhost” or “127.0.0.1”
  allow_underscores: true,
  host_whitelist: ['localhost', '127.0.0.1'],
}

function isLocalOrPublicUrl(str: string): boolean {
  return isURL(str, urlOptions)
}

/**
 * A generic API client interface.
 */
export interface APIClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R>
}

/**
 * APIClient is a simple wrapper around Axios for making HTTP requests.
 */
class AxiosAPIClient implements APIClient {
  private axiosInstance: AxiosInstance

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({ baseURL })
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config)
    return response.data
  }

  public async post<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R> {
    const response = await this.axiosInstance.post<R>(url, data, config)
    return response.data
  }
}

export function createApiClient(baseURL: string) {
  if (!isLocalOrPublicUrl(baseURL)) {
    throw new Error(`Error: Failed to init axios client, invalid baseURL: ${baseURL}`)
  }
  return new AxiosAPIClient(baseURL)
}
