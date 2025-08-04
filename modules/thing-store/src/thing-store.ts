/**
 * Base interface for storable entities with generic type and data
 */
export interface Thing<K extends string, T> {
  id: string
  type: K
  data: string // stringified representation of T
  parser: (input: unknown) => Promise<T>
  createdAt: number
  updatedAt: number
}

/**
 * Internal storage representation (without parser function)
 */
interface StoredThing {
  id: string
  type: string
  data: string
  createdAt: number
  updatedAt: number
}

/**
 * Interface for a storage system that can store and retrieve Things
 */
export interface ThingStore {
  /**
   * Store a thing with the provided type, data, and parser
   * @param type The type identifier for the thing
   * @param data The data to store (will be stringified)
   * @param parser Function to parse the data when retrieving
   * @returns The generated ID for the stored thing
   */
  save<K extends string, T>(type: K, data: T, parser: (input: unknown) => Promise<T>): Promise<string>

  /**
   * Retrieve a thing by id and type
   * @param id The id of the thing
   * @param type The type of the thing
   * @param parser Function to parse the stored data
   * @returns The retrieved thing or null if not found
   */
  findById<K extends string, T>(
    id: string,
    type: K,
    parser: (input: unknown) => Promise<T>,
  ): Promise<Thing<K, T> | null>

  /**
   * Find things by type with optional filter
   * @param type The type of things to find
   * @param parser Function to parse the stored data
   * @param filter Optional filter function
   * @returns Array of matching things
   */
  findByType<K extends string, T>(
    type: K,
    parser: (input: unknown) => Promise<T>,
    filter?: (thing: Thing<K, T>) => boolean,
  ): Promise<Thing<K, T>[]>

  /**
   * Update a thing
   * @param id The id of the thing to update
   * @param type The type of the thing
   * @param data The new data
   * @param parser Function to parse the data
   * @returns The updated thing
   */
  update<K extends string, T>(
    id: string,
    type: K,
    data: T,
    parser: (input: unknown) => Promise<T>,
  ): Promise<Thing<K, T>>

  /**
   * Delete a thing by id and type
   * @param id The id of the thing
   * @param type The type of the thing
   * @returns True if thing was deleted, false otherwise
   */
  delete(id: string, type: string): Promise<boolean>
}
