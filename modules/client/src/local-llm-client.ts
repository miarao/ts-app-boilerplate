import { APIClient, createApiClient } from './client'

/**
 * Request type for the /generate endpoint.
 */
export interface GenerateRequest {
  prompt: string
  example_set?: string
}

/**
 * Response structure from the llama-cpp model
 */
export interface LlamaCppModelResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    text: string
    index: number
    logprobs: null
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Response type from the /generate endpoint.
 */
export interface GenerateResponse {
  response: LlamaCppModelResponse
}

/**
 * Response type from the root (/) endpoint.
 */
export interface RootResponse {
  message: string
}

/**
 * LlmApiClient wraps API calls to the LLM server.
 */
export class LlmApiClient {
  private apiClient: APIClient

  /**
   * @param baseURL - The base URL of the LLM server (e.g., http://localhost:1406)
   */
  constructor(baseURL: string) {
    this.apiClient = createApiClient(baseURL)
  }

  /**
   * Checks if the server is running.
   * @returns A promise resolving to the server status.
   */
  public async getStatus(): Promise<RootResponse> {
    return await this.apiClient.get<RootResponse>('/')
  }

  /**
   * Sends a prompt to the server and returns generated text.
   * @param request - The prompt and optional example_set encapsulated in a GenerateRequest.
   * @returns A promise resolving to the generated text.
   */
  public async generateText(request: GenerateRequest): Promise<GenerateResponse> {
    return await this.apiClient.post<GenerateRequest, GenerateResponse>('/generate', request)
  }
}
