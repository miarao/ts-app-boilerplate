import { createDefaultLogger, Logger } from 'logger'
import { Moment } from 'misc'

import type { RequestContext } from './handler'

/**
 * Throttler interface for rate-limiting requests.
 */
export interface Throttler {
  throttle(context: RequestContext): Promise<void>
}

/**
 * Options to configure SimpleThrottler.
 * - perMinute: maximum allowed requests per 60-second window
 * - perHour:   maximum allowed requests per 3600-second window
 * - clock:     optional custom clock (defaults to Moment.now)
 *
 * Must specify at least one of `perMinute` or `perHour`.
 */
export interface SimpleThrottlerOptions {
  perMinute?: number
  perHour?: number
  clock?: { now(): Moment }
}

/**
 * A simple implementation of Throttler using Moment as clock.
 * Tracks counts in fixed windows (minute and/or hour).
 */
export class SimpleThrottler implements Throttler {
  private readonly perMinute?: number
  private readonly perHour?: number
  private readonly clock: { now(): Moment }

  private minuteWindowStart: Moment
  private minuteCount = 0
  private hourWindowStart: Moment
  private hourCount = 0

  constructor(private readonly logger: Logger = createDefaultLogger('info'), options: SimpleThrottlerOptions) {
    const { perMinute, perHour, clock } = options
    Number.isInteger(perMinute)
    const minuteValid = perMinute !== undefined && perMinute >= 1
    const hourValid = perHour !== undefined && perHour >= 1

    if (!minuteValid && !hourValid) {
      throw new Error('Throttler must have at least one limit (perMinute or perHour) defined and positive.')
    }

    this.perMinute = perMinute
    this.perHour = perHour
    this.clock = clock ?? { now: () => Moment.now() }

    const now = this.clock.now()
    this.minuteWindowStart = now
    this.hourWindowStart = now
  }

  async throttle(_context: RequestContext): Promise<void> {
    const now = this.clock.now()

    // Minute window
    if (this.perMinute != null) {
      const elapsedMs = now.toNativeDate().getTime() - this.minuteWindowStart.toNativeDate().getTime()
      if (elapsedMs >= 60_000) {
        this.minuteWindowStart = now
        this.minuteCount = 0
      }
      this.minuteCount++
      if (this.minuteCount > this.perMinute) {
        throw new Error(`Rate limit exceeded: more than ${this.perMinute} requests per minute`)
      }
    }

    // Hour window
    if (this.perHour != null) {
      const elapsedMs = now.toNativeDate().getTime() - this.hourWindowStart.toNativeDate().getTime()
      if (elapsedMs >= 3_600_000) {
        this.hourWindowStart = now
        this.hourCount = 0
      }
      this.hourCount++
      if (this.hourCount > this.perHour) {
        throw new Error(`Rate limit exceeded: more than ${this.perHour} requests per hour`)
      }
    }
  }
}
