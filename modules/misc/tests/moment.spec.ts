// moment.test.ts

import { Moment } from '../src'

describe('Moment', () => {
  beforeEach(() => {
    Moment.reset()
  })

  describe('constructor & parsing', () => {
    it('parses a valid ISO string', () => {
      const iso = '2021-06-15T12:30:45Z'
      const m = new Moment(iso)
      expect(m.toIsoString()).toBe(iso)
    })

    it('clones a Date instance', () => {
      const date = new Date('2022-01-01T00:00:00Z')
      const m = new Moment(date)
      const native = m.toNativeDate()
      native.setFullYear(2000)
      // original Moment should not change
      expect(m.datePart('year')).toBe(2022)
    })

    it('accepts a millisecond timestamp', () => {
      const ts = Date.UTC(2020, 0, 1, 0, 0, 0)
      const m = new Moment(ts)
      expect(m.toIsoString()).toBe('2020-01-01T00:00:00Z')
    })

    it('throws on invalid ISO string', () => {
      expect(() => new Moment('not-a-date')).toThrow(/Invalid ISO date string/)
    })
  })

  describe('static factories', () => {
    it('now() returns current time (real until ticked)', () => {
      const real = Moment.now().toNativeDate().getTime()
      // allow small tolerance
      expect(Math.abs(real - Date.now())).toBeLessThan(50)
    })

    it('fromParts(year, month, day) sets correct Y/M/D', () => {
      const m = Moment.fromParts(2023, 12, 31)
      expect(m.datePart('year')).toBe(2023)
      expect(m.datePart('month')).toBe(12)
      expect(m.datePart('day')).toBe(31)
    })

    it('parseIso is alias for new Moment(iso)', () => {
      const iso = '2024-04-23T10:00:00Z'
      const a = Moment.parseIso(iso)
      const b = new Moment(iso)
      expect(a.toIsoString()).toBe(b.toIsoString())
    })
  })

  describe('format & toString', () => {
    const iso = '2021-06-15T12:30:45Z'
    let m: InstanceType<typeof Moment>
    beforeEach(() => {
      m = new Moment(iso)
    })

    it('toIsoString() === formatISO(date)', () => {
      expect(m.toIsoString()).toBe(iso)
    })

    it('format(fmt) applies date-fns tokens', () => {
      expect(m.format('yyyy-MM-dd HH:mm:ss')).toBe('2021-06-15 12:30:45')
    })

    it('toString() defaults to ISO', () => {
      expect(m.toString()).toBe(m.toIsoString())
    })
  })

  describe('datePart & timePart', () => {
    const iso = '2021-01-03T07:08:09Z' // Sunday
    let m: InstanceType<typeof Moment>
    beforeEach(() => {
      m = new Moment(iso)
    })

    it('datePart("year"/"month"/"day")', () => {
      expect(m.datePart('year')).toBe(2021)
      expect(m.datePart('month')).toBe(1)
      expect(m.datePart('day')).toBe(3)
    })

    it('datePart("weekday") where Sunday = 1', () => {
      // JS getDay() returns 0 for Sunday → +1 → 1
      expect(m.datePart('weekday')).toBe(1)
    })

    it('timePart("hour"/"minute"/"second")', () => {
      expect(m.timePart('hour')).toBe(7)
      expect(m.timePart('minute')).toBe(8)
      expect(m.timePart('second')).toBe(9)
    })
  })

  describe('shiftBy & comparisons', () => {
    const baseIso = '2021-01-01T00:00:00Z'
    let base: InstanceType<typeof Moment>

    beforeEach(() => {
      base = new Moment(baseIso)
    })

    it('shiftBy(1, "days") moves one calendar day', () => {
      const next = base.shiftBy(1, 'days')
      expect(next.daysBetween(base)).toBe(1)
    })

    it('shiftBy negative amounts works', () => {
      const prev = base.shiftBy(-2, 'days')
      expect(prev.daysBetween(base)).toBe(2)
    })

    it('shiftBy hours adjusts timePart correctly', () => {
      const t = base.shiftBy(5, 'hours')
      expect(t.timePart('hour')).toBe(5)
    })

    it('isBefore / isAfter / isSameDay', () => {
      const sameDayLater = base.shiftBy(20, 'hours')
      expect(base.isBefore(sameDayLater)).toBe(true)
      expect(sameDayLater.isAfter(base)).toBe(true)
      expect(base.isSameDay(sameDayLater)).toBe(true)

      const nextDay = base.shiftBy(1, 'days')
      expect(base.isSameDay(nextDay)).toBe(false)
    })

    it('daysBetween returns absolute full-day difference', () => {
      const a = new Moment('2021-01-05T23:59:59Z')
      const b = new Moment('2021-01-01T00:00:00Z')
      expect(a.daysBetween(b)).toBe(4)
    })
  })

  describe('tick (testing helper)', () => {
    beforeEach(() => {
      Moment.reset()
    })

    it('advances the internal clock by exactly the given milliseconds', () => {
      const beforeMs = Moment.now().toNativeDate().getTime()
      Moment.tick(2500) // advance by 2.5 seconds
      const afterMs = Moment.now().toNativeDate().getTime()
      expect(afterMs - beforeMs).toBe(2500)
    })
  })

  describe('measure (testing helper)', () => {
    beforeEach(() => {
      Moment.reset()
    })

    it('first call returns 0 and subsequent calls track real elapsed time', async () => {
      const M = Moment
      // reset the timer
      M.reset()

      // initial call
      expect(M.measure()).toBe(0)

      // wait ~50ms
      await new Promise<void>(resolve => setTimeout(resolve, 50))

      // measure should be at least the sleep duration
      const elapsed = M.measure()
      expect(elapsed).toBeGreaterThanOrEqual(50) // allow small scheduling jitter
      expect(elapsed).toBeLessThanOrEqual(500) // sanity upper bound
    }, 1000) // give Jest up to 1s to run this test
  })
})
