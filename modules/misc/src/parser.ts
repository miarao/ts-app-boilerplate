import { z } from 'zod'

import { errorLike } from './misc'
/**
 * Represents a parser that can validate and transform data
 */
export interface Parser<T> {
  parse(input: unknown): Promise<T>
}

export function zodThingParser<T>(schema: z.ZodType<T>): Parser<T> {
  return {
    parse: (input: unknown): Promise<T> => {
      if (typeof input !== 'string') {
        throw new Error('Expected input to be a JSON string')
      }

      let jsond: unknown
      try {
        jsond = JSON.parse(input)
      } catch (error) {
        throw new Error(`Failed to parse JSON: ${errorLike(error).message}`)
      }

      try {
        const parsed = schema.parse(jsond)
        return Promise.resolve(parsed)
      } catch (error) {
        throw new Error(`Schema validation failed: ${errorLike(error).message}`)
      }
    },
  }
}
