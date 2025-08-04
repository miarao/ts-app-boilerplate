import { GenerateContentConfig, GenerateContentParameters, GoogleGenAI, Schema as GenAISchema } from '@google/genai'
import { Logger } from 'logger'
import { makeId } from 'misc'
import { GenerateConfig, GoogleModelVariant, Model, Options } from 'model-hub-api'

/**
 * Wraps GoogleGenAI so callers only need to pick a short variant,
 * supply an API key and optional overrides — everything else is handled.
 */
export class TextModel implements Model {
  readonly id: string
  readonly name: string
  readonly provider = 'google'
  readonly streaming: boolean = false

  private readonly client: GoogleGenAI
  private readonly baseConfig: { model: string } & { baseGenerateConfig: GenerateContentConfig }

  constructor(
    private readonly logger: Logger,
    private readonly variant: GoogleModelVariant,
    apiKey: string,
    options?: Options,
  ) {
    const { enableStreaming = false, generateConfig = {} } = options ?? {}
    if (enableStreaming) {
      throw new Error('streaming is not yet implemented')
    }
    this.streaming = enableStreaming

    this.id = `model-${this.provider}-${makeId()}`
    this.name = `${this.provider}:${this.variant}`

    this.client = new GoogleGenAI({ apiKey })

    // Sensible defaults, merged with any overrides the caller provided
    this.baseConfig = {
      model: this.variant,
      // defaults you choose—tweak as you see fit
      baseGenerateConfig: {
        temperature: 0.1,
        topP: 0.1,
        maxOutputTokens: 1024,
        ...generateConfig,
      },
    }
  }

  async complete(prompt: string, perCallConfig?: GenerateConfig): Promise<string> {
    const { model, baseGenerateConfig } = this.baseConfig

    // Merge base config with per-call config
    const mergedConfig: GenerateContentConfig = {
      ...baseGenerateConfig,
    }

    if (perCallConfig) {
      if (perCallConfig.temperature !== undefined) {
        mergedConfig.temperature = perCallConfig.temperature
      }
      if (perCallConfig.maxOutputTokens !== undefined) {
        mergedConfig.maxOutputTokens = perCallConfig.maxOutputTokens
      }
      if (perCallConfig.topP !== undefined) {
        mergedConfig.topP = perCallConfig.topP
      }
      if (perCallConfig.topK !== undefined) {
        mergedConfig.topK = perCallConfig.topK
      }
      if (perCallConfig.responseMimeType !== undefined) {
        mergedConfig.responseMimeType = perCallConfig.responseMimeType
      }
      if (perCallConfig.responseSchema !== null && perCallConfig.responseSchema !== undefined) {
        mergedConfig.responseSchema = perCallConfig.responseSchema satisfies GenAISchema
      }
    }

    // Handle system instructions - these go in the request, not config
    let systemInstruction: string | undefined
    if (perCallConfig?.systemInstructions) {
      if (Array.isArray(perCallConfig.systemInstructions)) {
        systemInstruction = perCallConfig.systemInstructions.join('\n')
      } else {
        systemInstruction = perCallConfig.systemInstructions
      }
    }

    const generationArgs: GenerateContentParameters = {
      model,
      contents: prompt,
      config: mergedConfig,
      ...(systemInstruction && { systemInstruction }),
    }

    const response = await this.client.models.generateContent(generationArgs)
    return response.text ?? ''
  }

  /** The TS SDK currently doesn’t expose a streaming API, so we return false. */
  supportsStreaming(): boolean {
    // TODO (om): support streamed responses
    return false
  }

  // TODO (om): this was set here as an indicator - the pattern was taken from:
  //  https://ai.google.dev/gemini-api/docs/text-generation#streaming-responses
  //  callback should return the partial chunk back to the caller and allow it to work on it iteratively
  //  similar to our current experience of LLM interactions where the text is being generated "on the fly" using
  //  Server-Sent Events (SSE), rather than a perception of stream via simulated typing effects of precomputed responses
  async streamComplete(prompt: string, callback: (chunk: string) => void): Promise<string[]> {
    if (!this.supportsStreaming()) {
      this.logger.info(`model with id: ${this.id} does not support streaming, model name: ${this.name}`)
      return Promise.resolve([])
    }

    const chunks: string[] = []

    const stream = await this.client.models.generateContentStream({
      ...this.baseConfig,
      contents: prompt,
    })

    for await (const chunk of stream) {
      const text = chunk.text ?? ''
      this.logger.info(`received chunk. content ${text}`)
      chunks.push(text)
      callback(text)
    }

    return chunks
  }
}
