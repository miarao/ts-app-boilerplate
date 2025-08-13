import {
  GetEntityGraphRequest,
  GetEntityGraphResponse,
  GetMembersRequest,
  GetMembersResponse,
  HelloMemberRequest,
  HelloMemberResponse,
  Member,
} from 'hello-api'
import { createDefaultLogger, Logger } from 'logger'
import { Instant, zodThingParser } from 'misc'
import { processAndNormalize } from 'playground'
import { ServiceWithData, SimpleThrottler } from 'service-boilerplate'
import { defineEndpoint } from 'service-primitives'
import { ServiceCatalog } from 'service-router'
import { ThingStore } from 'thing-store'

/**
 * HelloService implementation using ServiceBoilerplate pattern directly
 */
export class HelloService extends ServiceWithData {
  constructor(
    logger: Logger = createDefaultLogger('info'),
    private readonly clock: Instant = Instant.now(),
    protected readonly store: ThingStore,
  ) {
    const catalog = new ServiceCatalog(logger)
    const throttler = new SimpleThrottler(logger, { perMinute: 60 })

    const dataTypes = { member: zodThingParser(Member) }

    super(logger, catalog, throttler, store, dataTypes)

    this.registerEndpoints(catalog)
  }

  /**
   * Register all service endpoints
   */
  private registerEndpoints(catalog: ServiceCatalog): void {
    // Register helloMember endpoint
    catalog.register(
      defineEndpoint('helloMember', HelloMemberRequest, HelloMemberResponse, {
        handle: async (request, context) => {
          this.logger.info(`Processing helloMember request for ${request.name}`, { requestId: context.requestId })

          // Create email from name (replace spaces with dots, lowercase)
          const email = `${request.name.toLowerCase().replace(/\s+/g, '.')}@domain.com`

          // Create and save the member
          const member: Member = {
            name: request.name,
            email,
          }

          await this.saveData('member', member)
          this.logger.info(`Saved member: ${member.name} (${member.email})`, { requestId: context.requestId })

          return {
            name: member.name,
            email: member.email,
          }
        },
      }),
    )

    // Register getMembers endpoint
    catalog.register(
      defineEndpoint('getMembers', GetMembersRequest, GetMembersResponse, {
        handle: async (_request, context) => {
          this.logger.info('Processing getMembers request', { requestId: context.requestId })

          // Retrieve all members from the store
          const members = await this.getDataByType<Member>('member')
          const response = members.map(member => ({
            name: member.name,
            email: member.email,
          }))

          this.logger.info(`Retrieved ${members.length} members`, { requestId: context.requestId })

          return response
        },
      }),
    )

    catalog.register(
      defineEndpoint('getEntityMap', GetMembersRequest, GetMembersResponse, {
        handle: async (_request, context) => {
          this.logger.info('Processing getMembers request', { requestId: context.requestId })

          // Retrieve all members from the store
          const members = await this.getDataByType<Member>('member')
          const response = members.map(member => ({
            name: member.name,
            email: member.email,
          }))

          this.logger.info(`Retrieved ${members.length} members`, { requestId: context.requestId })

          return response
        },
      }),
    )

    catalog.register(
      defineEndpoint('getEntityGraph', GetEntityGraphRequest, GetEntityGraphResponse, {
        handle: async (_request, context) => {
          this.logger.info('Processing getEntityGraph request', { requestId: context.requestId })

          try {
            // Call processAndNormalize from playground module
            const normalizedEvents = processAndNormalize()

            this.logger.info(`Retrieved ${normalizedEvents.length} normalized events`, {
              requestId: context.requestId,
            })

            return normalizedEvents
          } catch (error) {
            this.logger.error('Error processing entity graph', {
              requestId: context.requestId,
              error: error instanceof Error ? error.message : String(error),
            })
            throw error
          }
        },
      }),
    )
  }
}
