import { Logger } from 'logger'
import { errorLike, Instant, Parser } from 'misc'
import { ServiceCatalog } from 'service-router'
import { ThingStore } from 'thing-store'

import { ServiceBoilerplate } from './service-boilerplate'
import { Throttler } from '../../service-throttler/src/throttler'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataTypeRegistry = Record<string, Parser<any>>

export interface ParsedThing<T> {
  id: string
  type: string
  data: T
  createdAt: number
  updatedAt: number
}

/**
 * Concrete service class with built-in data management capabilities.
 * Services provide their data types and parsers via constructor.
 */
export class ServiceWithData extends ServiceBoilerplate {
  private readonly dataTypes: DataTypeRegistry

  constructor(
    logger: Logger,
    clock: Instant,
    catalog: ServiceCatalog<unknown, unknown>,
    throttler: Throttler,
    protected store: ThingStore,
    dataTypes: DataTypeRegistry,
  ) {
    super(logger, clock, catalog, throttler)
    this.dataTypes = dataTypes
  }

  /**
   * ✅ IMPROVED: Validates data before saving
   */
  protected async saveData<T>(typeName: string, data: T): Promise<string> {
    const parser = this.dataTypes[typeName]
    if (!parser) {
      throw new Error(
        `saveData error. Unknown data type: ${typeName}. Available types: ${Object.keys(this.dataTypes).join(', ')}`,
      )
    }

    // ✅ Validate data before saving (fail fast!)
    try {
      await this.validateData(data, parser)
    } catch (error) {
      throw new Error(`Validation failed before saving ${typeName}: ${errorLike(error).message}`)
    }

    return await this.store.save(typeName, data, parser.parse)
  }

  protected async findDataById<T>(typeName: string, id: string): Promise<ParsedThing<T> | null> {
    const parser = this.dataTypes[typeName]
    if (!parser) {
      throw new Error(
        `findDataById error. Unknown data type: ${typeName}. Available types: ${Object.keys(this.dataTypes).join(
          ', ',
        )}`,
      )
    }

    const thing = await this.store.findById(id, typeName, parser.parse)
    if (!thing) {
      return null
    }

    const parsedData = await thing.parser(thing.data)
    return {
      id: thing.id,
      type: thing.type,
      data: parsedData, // ✅ Parsed object!
      createdAt: thing.createdAt,
      updatedAt: thing.updatedAt,
    }
  }

  protected async findDataByType<T>(
    typeName: string,
    filter?: (data: T) => boolean, // ✅ Filter operates on parsed data
  ): Promise<ParsedThing<T>[]> {
    const parser = this.dataTypes[typeName]
    if (!parser) {
      throw new Error(
        `findDataByType error. Unknown data type: ${typeName}. Available types: ${Object.keys(this.dataTypes).join(
          ', ',
        )}`,
      )
    }

    const things = await this.store.findByType(typeName, parser.parse)
    const results: ParsedThing<T>[] = []

    for (const thing of things) {
      const parsedData = await thing.parser(thing.data)

      if (!filter || filter(parsedData)) {
        results.push({
          id: thing.id,
          type: thing.type,
          data: parsedData,
          createdAt: thing.createdAt,
          updatedAt: thing.updatedAt,
        })
      }
    }

    return results
  }

  protected async updateData<T>(typeName: string, id: string, data: T): Promise<ParsedThing<T>> {
    const parser = this.dataTypes[typeName]
    if (!parser) {
      throw new Error(
        `updateData error. Unknown data type: ${typeName}. Available types: ${Object.keys(this.dataTypes).join(', ')}`,
      )
    }

    // Validate data before updating
    try {
      await this.validateData(data, parser)
    } catch (error) {
      throw new Error(
        `Validation failed before updating ${typeName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }

    const thing = await this.store.update(id, typeName, data, parser.parse)

    // Return parsed result
    const parsedData = await thing.parser(thing.data)
    return {
      id: thing.id,
      type: thing.type,
      data: parsedData,
      createdAt: thing.createdAt,
      updatedAt: thing.updatedAt,
    }
  }

  /**
   * Delete operation (unchanged)
   */
  protected async deleteData(id: string, typeName: string): Promise<boolean> {
    return await this.store.delete(id, typeName)
  }

  /**
   * Helper method to validate data against parser
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async validateData<T>(data: T, parser: Parser<any>): Promise<void> {
    // Serialize and then parse to simulate the round-trip validation
    const serialized = JSON.stringify(data)
    await parser.parse(serialized)
  }

  /**
   * ✅ NEW: Get array of just the parsed data (convenience method)
   */
  protected async getDataByType<T>(typeName: string, filter?: (data: T) => boolean): Promise<T[]> {
    const results = await this.findDataByType<T>(typeName, filter)
    return results.map(result => result.data)
  }

  /**
   * Get all registered data type names (useful for debugging)
   */
  protected getRegisteredDataTypes(): string[] {
    return Object.keys(this.dataTypes)
  }

  /**
   * Check if a data type is registered
   */
  protected hasDataType(typeName: string): boolean {
    return typeName in this.dataTypes
  }
}
