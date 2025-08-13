import { createDefaultLogger } from 'logger'
import { ServiceCatalog } from 'service-router'

import { RateLimiter, RateLimiterOptions } from '../src'

// Helper to create a deterministic clock for testing.  It exposes a `clock`
// property with a `now()` method returning the current ms and helpers to
// advance time.
function makeFakeClock(startMs: number) {
  let t = startMs
  return {
    clock: { now: () => t },
    tickMs(ms: number) {
      t += ms
    },
    setMs(ms: number) {
      t = ms
    },
    nowMs() {
      return t
    },
  }
}

describe('RateLimiter', () => {
  it('throws if no limits are provided', () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    // Expect constructor to throw when there are no default or endpoint limits
    expect(() => new RateLimiter(fake.clock)).toThrow(
      'RateLimiter requires at least one default limit (perMinute/perHour) or a non‑empty endpointLimits map.',
    )
  })

  it('enforces default per-minute limit and resets after a minute', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), { perMinute: 2 })
    await rl.throttle('ep')
    await rl.throttle('ep')
    await expect(rl.throttle('ep')).rejects.toThrow(/more than 2 requests per minute/)
    // Advance 61 seconds and ensure the window resets
    fake.tickMs(61_000)
    await expect(rl.throttle('ep')).resolves.toBeUndefined()
  })

  it('enforces default per-hour limit and resets after an hour', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), { perHour: 2 })
    await rl.throttle('ep')
    await rl.throttle('ep')
    await expect(rl.throttle('ep')).rejects.toThrow(/more than 2 requests per hour/)
    // Advance just over an hour
    fake.tickMs(3_601_000)
    await expect(rl.throttle('ep')).resolves.toBeUndefined()
  })

  it('enforces both minute and hour limits simultaneously', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), { perMinute: 1, perHour: 2 })
    await rl.throttle('ep')
    // Exceed minute limit first
    await expect(rl.throttle('ep')).rejects.toThrow(/more than 1 requests per minute/)
    // Advance minute and call again
    fake.tickMs(61_000)
    await rl.throttle('ep')
    // Still within hour window; next call should trip hour limit
    fake.tickMs(61_000)
    await expect(rl.throttle('ep')).rejects.toThrow(/more than 2 requests per hour/)
  })

  it('applies endpoint-specific overrides', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const options: RateLimiterOptions = {
      perMinute: 3,
      endpointLimits: {
        special: { perMinute: 1 },
      },
    }
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), options)
    // default endpoint can be called up to 3 times per minute
    await rl.throttle('default')
    await rl.throttle('default')
    await rl.throttle('default')
    await expect(rl.throttle('default')).rejects.toThrow(/more than 3 requests per minute/)
    // override endpoint is limited to 1 call per minute
    await rl.throttle('special')
    await expect(rl.throttle('special')).rejects.toThrow(/more than 1 requests per minute/)
    // Advance minute resets both endpoints independently
    fake.tickMs(61_000)
    await rl.throttle('default')
    await rl.throttle('special')
  })

  it('allows unlimited calls when an endpoint has no applicable limits', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), {
      endpointLimits: { limited: { perMinute: 1 } },
    })
    // unlimited endpoint should never throw
    for (let i = 0; i < 100; i++) {
      await expect(rl.throttle('unlimited')).resolves.toBeUndefined()
    }
    // limited endpoint trips after one call
    await rl.throttle('limited')
    await expect(rl.throttle('limited')).rejects.toThrow(/limited.*1 requests per minute/)
  })

  it('maintains independent counters per endpoint', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), { perMinute: 1 })
    // first endpoint
    await rl.throttle('ep1')
    await expect(rl.throttle('ep1')).rejects.toThrow(/ep1.*1 requests per minute/)
    // second endpoint still has its own allowance
    await rl.throttle('ep2')
    await expect(rl.throttle('ep2')).rejects.toThrow(/ep2.*1 requests per minute/)
  })

  it('resets counters after hour window on overridden endpoint', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), {
      perHour: 2,
      endpointLimits: { ep: { perHour: 1 } },
    })
    await rl.throttle('ep')
    await expect(rl.throttle('ep')).rejects.toThrow(/ep.*1 requests per hour/)
    fake.tickMs(3_600_001)
    await expect(rl.throttle('ep')).resolves.toBeUndefined()
  })

  it('pre-initializes state using ServiceCatalog', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    // Minimal catalog stub: only implements list(); we cast to ServiceCatalog
    const catalog = {
      list: () => ['ep1', 'ep2'],
    } as unknown as ServiceCatalog<unknown, unknown>
    const rl = new RateLimiter(fake.clock, createDefaultLogger('info'), { perMinute: 1 }, catalog)
    // Both endpoints should be throttled independently
    await rl.throttle('ep1')
    await expect(rl.throttle('ep1')).rejects.toThrow(/ep1/)
    await rl.throttle('ep2')
    await expect(rl.throttle('ep2')).rejects.toThrow(/ep2/)
  })
})
