import { z } from 'zod'

import { GenerateConfig } from './generate-config'

// Define the GoogleModelVariant enum to match the one in the service
export enum GoogleModelVariant {
  '2.5-flash-preview' = 'gemini-2.5-flash-preview-04-17',
  '2.0-flash' = 'gemini-2.0-flash',
}

export interface Model {
  // Basic identity
  readonly id: string
  readonly name: string
  readonly provider: string

  complete(prompt: string): Promise<string>

  supportsStreaming(): boolean
  streamComplete?(prompt: string, callback: (chunk: string) => void): Promise<string[]>
}

export const Options = z.object({
  enableStreaming: z.boolean(),
  generateConfig: GenerateConfig.optional(),
})
export type Options = z.infer<typeof Options>

// Define CreateModelRequest schema
export const CreateModelRequest = z.object({
  variantKey: z.nativeEnum(GoogleModelVariant),
  options: Options.optional(),
})
export type CreateModelRequest = z.infer<typeof CreateModelRequest>

// Define model response schema
export const CreateModelResponse = z.object({
  id: z.string(),
})
export type CreateModelResponse = z.infer<typeof CreateModelResponse>

export const PromptModelRequest = z.object({
  modelId: z.string(),
  prompt: z.string(),
  promptConfig: GenerateConfig.optional(),
})
export type PromptModelRequest = z.infer<typeof PromptModelRequest>

// Define model response schema
export const PromptModelResponse = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), data: z.string() }),
  z.object({ status: z.literal('failed'), error: z.instanceof(Error) }),
])
export type PromptModelResponse = z.infer<typeof PromptModelResponse>
