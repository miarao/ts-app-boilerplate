import { createNoOpLogger } from 'logger'
import { Moment } from 'misc'

import type { RequestContext } from '../src'
import { SimpleThrottler, SimpleThrottlerOptions } from '../src/throttler'

class TestSimpleThrottler extends SimpleThrottler {
  constructor(options: SimpleThrottlerOptions) {
    super(createNoOpLogger(), options)
  }
}
describe('SimpleThrottler', () => {
  const testCtx: RequestContext = { requestId: 'test' }

  beforeEach(() => {
    // Reset fake clock between tests
    Moment.reset()
  })

  it('should throw if neither perMinute nor perHour is provided', () => {
    expect(() => new TestSimpleThrottler({})).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
  })

  it('should throw if only perMinute provided, and its zero or negative', () => {
    expect(() => new TestSimpleThrottler({ perMinute: 0 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
    expect(() => new TestSimpleThrottler({ perMinute: -5 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
  })

  it('should throw if perHour provided, and its zero or negative', () => {
    expect(() => new TestSimpleThrottler({ perHour: 0 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
    expect(() => new TestSimpleThrottler({ perHour: -10 })).toThrow(
      'Throttler must have at least one limit (perMinute or perHour) defined and positive.',
    )
  })

  it('should allow requests under the per-minute limit and resets after a minute', async () => {
    const throttler = new TestSimpleThrottler({ perMinute: 2 })
    // First two calls should pass
    await throttler.throttle(testCtx)
    await throttler.throttle(testCtx)
    // Third call within same minute exceeds
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 2 requests per minute')

    // Advance fake clock by 61 seconds
    Moment.tick(61, 'seconds')
    // After window reset, should allow again
    await expect(throttler.throttle(testCtx)).resolves.toBeUndefined()
  })

  it('should allow requests under the per-hour limit and resets after an hour', async () => {
    const throttler = new TestSimpleThrottler({ perHour: 2 })
    // First two calls should pass
    await throttler.throttle(testCtx)
    await throttler.throttle(testCtx)
    // Third call within same hour exceeds
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 2 requests per hour')

    // Advance fake clock by 3601 seconds (~1 hour)
    Moment.tick(3601, 'seconds')
    // After window reset, should allow again
    await expect(throttler.throttle(testCtx)).resolves.toBeUndefined()
  })

  it('should enforce both minute and hour limits simultaneously', async () => {
    // perMinute: 1, perHour: 2
    const throttler = new TestSimpleThrottler({ perMinute: 1, perHour: 2 })
    // First call OK
    await throttler.throttle(testCtx)
    // Second call within same minute -> minute-limit breach
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 1 requests per minute')

    // Advance 61 seconds to reset minute window
    Moment.tick(61, 'seconds')

    await throttler.throttle(testCtx)

    Moment.tick(61, 'seconds')
    // Third call within hour window -> hour-limit breach
    await expect(throttler.throttle(testCtx)).rejects.toThrow('Rate limit exceeded: more than 2 requests per hour')
  })
})
