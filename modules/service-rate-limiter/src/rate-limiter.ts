import { createDefaultLogger, Logger } from 'logger'
import { Clock, Instant } from 'misc'
import { ServiceCatalog } from 'service-router'

/**
 * Configuration options for {@link RateLimiter}.
 *
 * The default limits (`perMinute`/`perHour`) apply to every endpoint unless
 * overridden in the `endpointLimits` map.  Providing at least one default
 * or endpoint‑specific limit is required; otherwise the rate limiter would
 * effectively do nothing.
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of calls allowed per minute for endpoints that do not have
   * a specific override in `endpointLimits`.
   */
  perMinute?: number
  /**
   * Maximum number of calls allowed per hour for endpoints that do not have
   * a specific override in `endpointLimits`.
   */
  perHour?: number
  /**
   * Optional map of endpoint‑specific rate limits.  An entry here overrides
   * the default limits for that endpoint.  Omitted limits mean the default
   * applies (e.g. specifying only `perMinute` leaves the hourly limit to the
   * global `perHour`).
   */
  endpointLimits?: Record<string, { perMinute?: number; perHour?: number }>
}

/**
 * Internal counter state for each endpoint.  It tracks the start of the
 * current minute and hour windows along with the counts observed so far.
 */
interface RateLimitState {
  minuteStart: number
  minuteCount: number
  hourStart: number
  hourCount: number
}

/**
 * A simple, endpoint‑aware fixed‑window rate limiter.
 *
 * The limiter maintains independent counters for each endpoint.  When a
 * request arrives, clients must call {@link throttle} with the target
 * endpoint name.  The limiter compares the request counts against the
 * configured per‑minute and per‑hour thresholds and throws an error if a
 * limit is exceeded.  It uses an injected clock (see {@link Clock}) so
 * that tests can control time deterministically.
 */
export class RateLimiter {
  /** Default per‑minute limit applied to endpoints without specific overrides. */
  private readonly defaultPerMinute?: number
  /** Default per‑hour limit applied to endpoints without specific overrides. */
  private readonly defaultPerHour?: number
  /** Per‑endpoint limit overrides. */
  private readonly perEndpoint: Map<string, { perMinute?: number; perHour?: number }>
  /** Per‑endpoint counter state. */
  private readonly states: Map<string, RateLimitState> = new Map()

  /**
   * Construct a new rate limiter.
   *
   * @param clock       An injected clock whose `now()` method returns the
   *                    current epoch milliseconds.  Passing the same clock as
   *                    the service improves determinism in tests.
   * @param logger      Optional logger.  A default no‑op logger is used if
   *                    none is provided.
   * @param options     Rate‑limit configuration.  At least one default or
   *                    endpoint‑specific limit must be supplied; otherwise
   *                    the constructor will throw.
   * @param catalog     Optional service catalog.  When provided, the limiter
   *                    pre‑initializes counters for each known endpoint.  If
   *                    new endpoints are registered later, their counters
   *                    are created lazily on first use.
   */
  constructor(
    private readonly clock: Clock,
    private readonly logger: Logger = createDefaultLogger('info'),
    options: RateLimiterOptions = {},
    private readonly catalog?: ServiceCatalog<unknown, unknown>,
  ) {
    const { perMinute, perHour, endpointLimits } = options
    // Ensure at least one limit is provided.  Without any limits, the limiter
    // serves no purpose and silently lets all requests through.
    const hasDefault = (perMinute != null && perMinute > 0) || (perHour != null && perHour > 0)
    const hasEndpoint = endpointLimits != null && Object.keys(endpointLimits).length > 0
    if (!hasDefault && !hasEndpoint) {
      throw new Error(
        'RateLimiter requires at least one default limit (perMinute/perHour) or a non‑empty endpointLimits map.',
      )
    }
    // Store defaults and overrides
    this.defaultPerMinute = perMinute
    this.defaultPerHour = perHour
    this.perEndpoint = new Map(Object.entries(endpointLimits ?? {}))
    // Pre‑populate state for known endpoints in the catalog
    if (catalog) {
      for (const name of catalog.list()) {
        this.ensureState(name)
      }
    }
  }

  /**
   * Obtain the current epoch milliseconds using the injected clock.  The
   * `Instant` helper is used to ensure the value is normalized, but this
   * function ultimately returns a plain number for convenience.
   */
  private nowMs(): number {
    return Instant.now(this.clock).epochMs()
  }

  /**
   * Ensure that a rate‑limit state exists for the given endpoint name.
   *
   * If no state exists yet, a new window starting at the current time is
   * created.  The state is returned for convenience.
   */
  private ensureState(name: string): RateLimitState {
    let state = this.states.get(name)
    if (!state) {
      const now = this.nowMs()
      state = { minuteStart: now, minuteCount: 0, hourStart: now, hourCount: 0 }
      this.states.set(name, state)
    }
    return state
  }

  /**
   * Enforce rate limits for the specified endpoint.  If the call exceeds
   * either the per‑minute or per‑hour limit, an error is thrown.  Otherwise
   * the method resolves with no value.
   *
   * @param endpointName  The logical name of the endpoint being invoked.
   */
  async throttle(endpointName?: string): Promise<void> {
    const name = endpointName ?? 'default'
    const state = this.ensureState(name)
    const now = this.nowMs()
    // Determine applicable limits: per‑endpoint overrides take precedence
    const override = this.perEndpoint.get(name)
    const limits = {
      perMinute: override?.perMinute ?? this.defaultPerMinute,
      perHour: override?.perHour ?? this.defaultPerHour,
    }
    // If neither limit applies to this endpoint, no throttling is needed
    if (!limits.perMinute && !limits.perHour) {
      return
    }
    // Minute window
    if (limits.perMinute) {
      // Reset the minute window if it has rolled over
      if (now - state.minuteStart >= 60_000) {
        state.minuteStart = now
        state.minuteCount = 0
      }
      state.minuteCount += 1
      if (state.minuteCount > (limits.perMinute as number)) {
        throw new Error(`Rate limit exceeded on endpoint '${name}': more than ${limits.perMinute} requests per minute`)
      }
    }
    // Hour window
    if (limits.perHour) {
      // Reset the hour window if it has rolled over
      if (now - state.hourStart >= 3_600_000) {
        state.hourStart = now
        state.hourCount = 0
      }
      state.hourCount += 1
      if (state.hourCount > (limits.perHour as number)) {
        throw new Error(`Rate limit exceeded on endpoint '${name}': more than ${limits.perHour} requests per hour`)
      }
    }
  }
}
