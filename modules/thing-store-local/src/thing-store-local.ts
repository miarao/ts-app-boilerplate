import { Level } from 'level'
import { errorLike, makeId } from 'misc'
import { Marker, pathByMark } from 'misc-fs'
import * as path from 'node:path'
import { Thing, ThingStore } from 'thing-store'

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
 * Level-based implementation of ThingStore
 */
export class ThingStoreLocal implements ThingStore {
  private db: Level<string, StoredThing>
  private isInitialized: boolean = false

  constructor(options?: { dbPath?: string; rootMarker?: Marker }) {
    const { dbPath, rootMarker } = options ?? {}

    let finalDbPath: string
    if (dbPath) {
      finalDbPath = dbPath
    } else {
      const projectRoot = pathByMark(rootMarker)
      finalDbPath = path.join(projectRoot, 'things')
    }

    this.db = new Level<string, StoredThing>(finalDbPath, {
      valueEncoding: 'json',
    })
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.db.open()
      this.isInitialized = true
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.db.close()
      this.isInitialized = false
    }
  }

  /**
   * Generate a key for storing a thing
   */
  private getKey(id: string, type: string): string {
    return `${type}:${id}`
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Convert stored thing to Thing with parser
   */
  private toThing<K extends string, T>(stored: StoredThing, parser: (input: unknown) => Promise<T>): Thing<K, T> {
    return {
      id: stored.id,
      type: stored.type as K,
      data: stored.data,
      parser,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    }
  }

  /**
   * Convert Thing to storable format
   */
  private toStoredThing<K extends string, T>(thing: Thing<K, T>): StoredThing {
    return {
      id: thing.id,
      type: thing.type,
      data: thing.data,
      createdAt: thing.createdAt,
      updatedAt: thing.updatedAt,
    }
  }

  async save<K extends string, T>(type: K, data: T, parser: (input: unknown) => Promise<T>): Promise<string> {
    await this.ensureInitialized()

    const id = makeId()
    const now = Date.now()

    const storedThing: StoredThing = {
      id,
      type,
      data: JSON.stringify(data),
      createdAt: now,
      updatedAt: now,
    }

    const key = this.getKey(id, type)
    await this.db.put(key, storedThing)

    return id
  }

  async findById<K extends string, T>(
    id: string,
    type: K,
    parser: (input: unknown) => Promise<T>,
  ): Promise<Thing<K, T> | null> {
    await this.ensureInitialized()
    const key = this.getKey(id, type)

    try {
      const stored = await this.db.get(key)
      if (stored === undefined || stored === null) {
        return null
      }
      return this.toThing<K, T>(stored, parser)
    } catch (err: unknown) {
      const error = errorLike(err)
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null
      }
      throw err
    }
  }

  async findByType<K extends string, T>(
    type: K,
    parser: (input: unknown) => Promise<T>,
    filter?: (thing: Thing<K, T>) => boolean,
  ): Promise<Thing<K, T>[]> {
    await this.ensureInitialized()

    const results: Thing<K, T>[] = []
    const prefix = `${type}:`

    for await (const [key, stored] of this.db.iterator()) {
      if (key.startsWith(prefix)) {
        const thing = this.toThing<K, T>(stored, parser)
        if (!filter || filter(thing)) {
          results.push(thing)
        }
      }
    }

    return results
  }

  async update<K extends string, T>(
    id: string,
    type: K,
    data: T,
    parser: (input: unknown) => Promise<T>,
  ): Promise<Thing<K, T>> {
    await this.ensureInitialized()

    const existing = await this.findById(id, type, parser)
    if (!existing) {
      throw new Error(`Cannot update non-existent thing: ${type}:${id}`)
    }

    const now = Date.now()
    const updatedStoredThing: StoredThing = {
      id,
      type,
      data: JSON.stringify(data),
      createdAt: existing.createdAt,
      updatedAt: now,
    }

    const key = this.getKey(id, type)
    await this.db.put(key, updatedStoredThing)

    return this.toThing<K, T>(updatedStoredThing, parser)
  }

  async delete(id: string, type: string): Promise<boolean> {
    await this.ensureInitialized()

    const key = this.getKey(id, type)

    try {
      // Check if exists first
      await this.db.get(key)
      await this.db.del(key)
      return true
    } catch (err: unknown) {
      const error = errorLike(err)
      if (error.code === 'LEVEL_NOT_FOUND' || error.name === 'NotFoundError') {
        return false
      }
      throw err
    }
  }
}
