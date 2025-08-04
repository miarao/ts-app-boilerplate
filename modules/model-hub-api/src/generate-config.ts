import { z } from 'zod'

// GenAISchema usage:
// const rawConfig = {
//   responseMimeType: "application/json",
//   responseSchema: {
//     type: "object",
//     properties: {
//       greeting: { type: "string", format: "email" },
//       count:    { type: "integer", minimum: 0 },
//     },
//     required: ["greeting"],
//   },
// };
export const GenAISchema: z.ZodType<unknown> = z
  .lazy(() =>
    z.object({
      // Basic type declaration (e.g. "string", "integer", "object", "array")
      type: z.string().optional(),

      // Object properties mapping to nested schemas
      properties: z.record(GenAISchema).optional(),

      // Array item schemas
      items: GenAISchema.optional(),

      // Enumerated literal values
      enum: z.array(z.union([z.string(), z.number()])).optional(),

      // Composition (select one of multiple schemas)
      anyOf: z.array(GenAISchema).optional(),

      // Required property names for objects
      required: z.array(z.string()).optional(),

      // Nullable flag: allows `null` if `type` is defined
      nullable: z.boolean().optional(),

      // Data formats (e.g. "email", "date-time")
      format: z.string().optional(),

      // Numeric constraints
      maximum: z.number().optional(),
      minimum: z.number().optional(),

      // Array constraints
      maxItems: z.number().optional(),
      minItems: z.number().optional(),

      // Controls generation order for properties
      propertyOrdering: z.array(z.string()).optional(),
    }),
  )
  .describe('GenAI Schema subset for JSON output')

export type GenAISchema = z.infer<typeof GenAISchema>

export const GenerateConfig = z.object({
  temperature: z.number().min(0).max(1).optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  systemInstructions: z.union([z.string(), z.array(z.string())]).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(0).max(1).optional(),
  responseMimeType: z.literal('application/json'),
  responseSchema: GenAISchema,
})
export type GenerateConfig = z.infer<typeof GenerateConfig>
