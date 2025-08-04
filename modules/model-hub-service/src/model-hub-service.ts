import { createDefaultLogger, Logger } from 'logger'
import { errorLike } from 'misc'
import { CreateModelRequest, CreateModelResponse, PromptModelRequest, PromptModelResponse } from 'model-hub-api'
import { defineEndpoint, ServiceBoilerplate, ServiceCatalog, SimpleThrottler } from 'service-boilerplate'

import { TextModel } from './model'

/**
 * ModelHubService provides access to AI model creation and inference
 * following the ServiceBoilerplate pattern.
 */
export class ModelHubService extends ServiceBoilerplate {
  private models: Map<string, TextModel> = new Map()

  /**
   * Creates a new ModelHubService
   *
   * @param logger Logger instance
   * @param apiKey The Google API key to use for model creation
   */
  constructor(readonly logger: Logger = createDefaultLogger('info'), private readonly apiKey: string) {
    const catalog = new ServiceCatalog(logger)
    // Set throttling rate to respect API limits
    // current limits: (taken from: https://ai.google.dev/gemini-api/docs/rate-limits#free-tier_1)
    // Gemini 2.5 Flash Preview 04-17	RPM: 10,	TPM: 250,000, RPD: 500
    // Gemini 2.0 Flash	RPM: 15,	TPM: 1,000,000, RPD: 1,500
    const throttler = new SimpleThrottler(logger, { perMinute: 10, perHour: 21 })

    super(logger, catalog, throttler)

    if (!this.apiKey) {
      logger.error('No API key provided for ModelHubService')
      throw new Error('GOOGLE_AI_API_KEY environment variable is required')
    }

    this.registerEndpoints(catalog)
  }

  /**
   * Register all service endpoints with the service catalog
   */
  private registerEndpoints(catalog: ServiceCatalog): void {
    // Register createModel endpoint
    catalog.register(
      defineEndpoint('createModel', CreateModelRequest, CreateModelResponse, {
        handle: async (request, context) => {
          this.logger.info(`Processing createModel request for variant: ${request.variantKey}`, {
            requestId: context.requestId,
          })

          try {
            const model = new TextModel(this.logger, request.variantKey, this.apiKey, request.options)

            this.models.set(model.id, model)

            this.logger.info(`Created model with ID: ${model.id}`, { requestId: context.requestId })

            return { id: model.id }
          } catch (err) {
            this.logger.error(`Error creating model: ${request.variantKey}`, err)
            throw new Error(`Failed to create model: ${errorLike(err).message}`)
          }
        },
      }),
    )

    catalog.register(
      defineEndpoint('promptModel', PromptModelRequest, PromptModelResponse, {
        handle: async (request, context) => {
          this.logger.info(`Processing promptModel request for model with id: ${request.modelId}`, {
            requestId: context.requestId,
          })

          const model = this.models.get(request.modelId)
          if (!model) {
            throw new Error(`Model with ID ${request.modelId} not found`)
          }

          try {
            const response = await model.complete(request.prompt)
            return { status: 'success' as const, data: response }
          } catch (e) {
            const error = errorLike(e) satisfies Error
            this.logger.error(`Error prompting model ${model.id}. Error: ${error.message}`)
            return { status: 'failed' as const, error }
          }
        },
      }),
    )
  }
}
