import * as uuid from 'uuid'
/**
 * Utility to generate a unique ID for documents and segments.
 * Using timestamp + random string to ensure uniqueness.
 */
export function makeId(): string {
  return uuid.v4()
}
