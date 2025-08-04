import { GetMembersRequest, GetMembersResponse, HelloMemberRequest, HelloMemberResponse, Member } from 'hello-api'
import { createDefaultLogger, Logger } from 'logger'
import { Moment, zodThingParser } from 'misc'
import { defineEndpoint, ServiceCatalog, ServiceWithData, SimpleThrottler } from 'service-boilerplate'
import { ThingStore } from 'thing-store'

/**
 * HelloService implementation using ServiceBoilerplate pattern directly
 */
export class HelloService extends ServiceWithData {
  constructor(
    logger: Logger = createDefaultLogger('info'),
    private readonly clock: Moment = Moment.now(),
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
  }
}
