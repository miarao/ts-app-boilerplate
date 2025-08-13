import { createDefaultLogger, Logger } from 'logger'
import { Instant } from 'misc'
import { RequestContext } from 'service-primitives'

export interface Throttler {
  throttle(context: RequestContext): Promise<void>
}

export interface SimpleThrottlerOptions {
  perMinute?: number
  perHour?: number
}

/**
 * Fixed-window throttler. Tracks counts per 60s and/or 3600s windows.
 * Window starts are epoch ms numbers. No Date allocations in the hot path.
 */
export class SimpleThrottler implements Throttler {
  private readonly perMinute?: number
  private readonly perHour?: number

  private minuteWindowStartMs: number
  private minuteCount = 0
  private hourWindowStartMs: number
  private hourCount = 0

  constructor(
    private readonly clock: Instant,
    private readonly logger: Logger = createDefaultLogger('info'),
    options: SimpleThrottlerOptions,
  ) {
    const { perMinute, perHour } = options

    const minuteValid = perMinute !== undefined && perMinute >= 1
    const hourValid = perHour !== undefined && perHour >= 1
    if (!minuteValid && !hourValid) {
      throw new Error('Throttler must have at least one limit (perMinute or perHour) defined and positive.')
    }

    this.perMinute = perMinute
    this.perHour = perHour

    const now = Instant.now().epochMs()
    this.minuteWindowStartMs = now
    this.hourWindowStartMs = now
  }

  async throttle(_context: RequestContext): Promise<void> {
    const now = Instant.now().epochMs()

    if (this.perMinute != null) {
      const elapsed = now - this.minuteWindowStartMs
      if (elapsed >= 60_000) {
        this.minuteWindowStartMs = now
        this.minuteCount = 0
      }
      this.minuteCount += 1
      if (this.minuteCount > this.perMinute) {
        throw new Error(`Rate limit exceeded: more than ${this.perMinute} requests per minute`)
      }
    }

    if (this.perHour != null) {
      const elapsed = now - this.hourWindowStartMs
      if (elapsed >= 3_600_000) {
        this.hourWindowStartMs = now
        this.hourCount = 0
      }
      this.hourCount += 1
      if (this.hourCount > this.perHour) {
        throw new Error(`Rate limit exceeded: more than ${this.perHour} requests per hour`)
      }
    }
  }
}
