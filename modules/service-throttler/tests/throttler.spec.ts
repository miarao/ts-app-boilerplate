// Minimal mutable clock for deterministic tests (epoch ms)
import { createNoOpLogger } from 'logger'
import { Instant } from 'misc'
import { RequestContext } from 'service-primitives'

import { SimpleThrottler, SimpleThrottlerOptions } from '../src'

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

class TestSimpleThrottler extends SimpleThrottler {
  constructor(options: SimpleThrottlerOptions) {
    super(makeFakeClock(Instant.now().epochMs()), createNoOpLogger(), options)
  }
}

describe('SimpleThrottler', () => {
  const testCtx: RequestContext = { requestId: 'test' }

  it('throws if neither perMinute nor perHour is provided', () => {
    expect(() => new TestSimpleThrottler({})).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
  })

  it('throws when perMinute is zero or negative', () => {
    expect(() => new TestSimpleThrottler({ perMinute: 0 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
    expect(() => new TestSimpleThrottler({ perMinute: -5 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
  })

  it('throws when perHour is zero or negative', () => {
    expect(() => new TestSimpleThrottler({ perHour: 0 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
    expect(() => new TestSimpleThrottler({ perHour: -10 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
  })

  it('enforces per-minute limit and resets after a minute', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const throttler = new TestSimpleThrottler({ perMinute: 2, clock: fake.clock })

    await throttler.throttle(testCtx)
    await throttler.throttle(testCtx)
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 2 requests per minute')

    // advance 61 seconds
    fake.tickMs(61_000)
    await expect(throttler.throttle(testCtx)).resolves.toBeUndefined()
  })

  it('enforces per-hour limit and resets after an hour', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const throttler = new TestSimpleThrottler({ perHour: 2, clock: fake.clock })

    await throttler.throttle(testCtx)
    await throttler.throttle(testCtx)
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 2 requests per hour')

    // advance a bit over an hour
    fake.tickMs(3_601_000)
    await expect(throttler.throttle(testCtx)).resolves.toBeUndefined()
  })

  it('enforces both minute and hour limits simultaneously', async () => {
    const fake = makeFakeClock(Date.UTC(2025, 0, 1, 0, 0, 0))
    const throttler = new TestSimpleThrottler({ perMinute: 1, perHour: 2, clock: fake.clock })

    await throttler.throttle(testCtx)
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 1 requests per minute')

    // reset minute window
    fake.tickMs(61_000)
    await throttler.throttle(testCtx)

    // still within the same hour window; next call should trip the hour limit
    fake.tickMs(61_000)
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 2 requests per hour')
  })
})
