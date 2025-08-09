import { type Clock, Instant } from '../src'

/**
 * Minimal mutable clock for deterministic tests.
 */
function makeFakeClock(startMs: number = Date.UTC(2025, 0, 1, 0, 0, 0)) {
  let t = startMs
  const clock: Clock = { now: () => t }
  return {
    clock,
    set: (ms: number) => {
      t = ms
    },
    tick: (ms: number) => {
      t += ms
    },
    current: () => t,
  }
}

describe('Instant', () => {
  describe('construction & parsing', () => {
    it('parses a valid ISO instant with Z', () => {
      const iso = '2021-06-15T12:30:45Z'
      const i = Instant.from(iso)
      expect(i.toIso()).toBe(iso)
    })

    it('parses ISO with an explicit offset and normalizes to UTC', () => {
      const src = '2021-06-15T12:30:45+02:00'
      const i = Instant.from(src)
      expect(i.toIso()).toBe('2021-06-15T10:30:45Z')
    })

    it('treats bare date string as UTC midnight', () => {
      const i = Instant.from('2025-08-08')
      expect(i.toIso()).toBe('2025-08-08T00:00:00Z')
    })

    it('treats bare datetime without offset as UTC', () => {
      const i = Instant.from('2025-08-08T01:02:03')
      expect(i.toIso()).toBe('2025-08-08T01:02:03Z')
    })

    it('accepts a Date instance and is immutable w.r.t source mutation', () => {
      const d = new Date('2022-01-01T00:00:00Z')
      const i = Instant.from(d)
      d.setUTCFullYear(1999) // mutate original Date
      expect(i.datePart('year')).toBe(2022)
    })

    it('accepts a millisecond timestamp', () => {
      const ts = Date.UTC(2020, 0, 1, 0, 0, 0)
      const i = Instant.from(ts)
      expect(i.toIso()).toBe('2020-01-01T00:00:00Z')
      expect(i.epochMs()).toBe(ts)
    })

    it('throws on invalid ISO string', () => {
      expect(() => Instant.from('not-a-date')).toThrow(/Invalid ISO date string/)
    })
  })

  describe('static factories', () => {
    it('now(clock) returns the clock time', () => {
      const fake = makeFakeClock(Date.UTC(2030, 6, 1, 12, 0, 0))
      const i = Instant.now(fake.clock)
      expect(i.toIso()).toBe('2030-07-01T12:00:00Z')
    })

    it('fromUtcParts sets correct Y/M/D (and defaults time to midnight)', () => {
      const i = Instant.fromUtcParts(2023, 12, 31)
      expect(i.datePart('year')).toBe(2023)
      expect(i.datePart('month')).toBe(12)
      expect(i.datePart('day')).toBe(31)
      expect(i.timePart('hour')).toBe(0)
      expect(i.timePart('minute')).toBe(0)
      expect(i.timePart('second')).toBe(0)
    })

    it('fromUtcParts allows full time precision including milliseconds', () => {
      const i = Instant.fromUtcParts(2024, 2, 29, 23, 59, 59, 123)
      expect(i.toIso()).toBe('2024-02-29T23:59:59Z') // default trims millis
      expect(i.toIso({ trimMillis: false })).toBe('2024-02-29T23:59:59.123Z')
    })
  })

  describe('formatting & primitives', () => {
    const i = Instant.from('2021-06-15T12:30:45.000Z')

    it('toIso() trims fractional seconds by default', () => {
      expect(i.toIso()).toBe('2021-06-15T12:30:45Z')
    })

    it('toIso({trimMillis:false}) preserves millisecond precision', () => {
      expect(i.toIso({ trimMillis: false })).toBe('2021-06-15T12:30:45.000Z')
    })

    it('toJSON() serializes to ISO', () => {
      expect(JSON.stringify({ t: i })).toBe('{"t":"2021-06-15T12:30:45Z"}')
    })

    it('toDate() returns a cloned Date that does not affect Instant', () => {
      const d = i.toDate()
      d.setUTCFullYear(1999)
      expect(i.datePart('year')).toBe(2021)
    })

    it('Symbol.toPrimitive: number -> epoch ms, string -> ISO', () => {
      // number context triggers Symbol.toPrimitive('number')
      const ms = Number(i)
      expect(typeof ms).toBe('number')
      expect(ms).toBe(i.epochMs())

      // string context triggers Symbol.toPrimitive('string')
      expect(String(i)).toBe(i.toIso())
      expect(`${i}`).toBe(i.toIso())
    })
  })

  describe('datePart & timePart', () => {
    const i = Instant.from('2021-01-03T07:08:09Z') // Sunday

    it('datePart("year"|"month"|"day")', () => {
      expect(i.datePart('year')).toBe(2021)
      expect(i.datePart('month')).toBe(1)
      expect(i.datePart('day')).toBe(3)
    })

    it('datePart("weekday") uses ISO Monday=1..Sunday=7', () => {
      expect(i.datePart('weekday')).toBe(7) // Sunday => 7
    })

    it('timePart("hour"|"minute"|"second")', () => {
      expect(i.timePart('hour')).toBe(7)
      expect(i.timePart('minute')).toBe(8)
      expect(i.timePart('second')).toBe(9)
    })
  })

  describe('shift & comparisons', () => {
    const base = Instant.from('2021-01-01T00:00:00Z')

    it('shift by whole days moves calendar day boundaries', () => {
      const next = base.shift(1, 'days')
      expect(next.daysBetweenUtc(base)).toBe(1)
    })

    it('shift by negative amounts works', () => {
      const prev = base.shift(-2, 'days')
      expect(prev.daysBetweenUtc(base)).toBe(2)
    })

    it('shift by hours adjusts timePart correctly', () => {
      const t = base.shift(5, 'hours')
      expect(t.timePart('hour')).toBe(5)
    })

    it('month boundary: Jan 31 + 1 month -> Feb 28 (date-fns end-of-month behavior)', () => {
      const jan31 = Instant.from('2021-01-31T00:00:00Z')
      const feb = jan31.shift(1, 'months')
      expect(feb.toIso()).toBe('2021-02-28T00:00:00Z')
    })

    it('isBefore / isAfter / equals / compare', () => {
      const laterSameDay = base.shift(20, 'hours')
      expect(base.isBefore(laterSameDay)).toBe(true)
      expect(laterSameDay.isAfter(base)).toBe(true)
      expect(base.isSameUtcDay(laterSameDay)).toBe(true)
      const nextDay = base.shift(1, 'days')
      expect(base.isSameUtcDay(nextDay)).toBe(false)
      expect(base.equals(Instant.from('2021-01-01T00:00:00Z'))).toBe(true)
      expect(base.compare(nextDay)).toBe(-1)
      expect(nextDay.compare(base)).toBe(1)
      expect(base.compare(Instant.from(base.epochMs()))).toBe(0)
    })

    it('daysBetweenUtc returns absolute whole-day difference', () => {
      const a = Instant.from('2021-01-05T23:59:59Z')
      const b = Instant.from('2021-01-01T00:00:00Z')
      expect(a.daysBetweenUtc(b)).toBe(4)
    })
  })

  describe('clock-driven behavior (no globals, no hidden state)', () => {
    it('now(fakeClock) reflects ticks precisely', () => {
      const fake = makeFakeClock(Date.UTC(2040, 3, 10, 8, 0, 0))
      const before = Instant.now(fake.clock).epochMs()
      fake.tick(2500)
      const after = Instant.now(fake.clock).epochMs()
      expect(after - before).toBe(2500)
    })

    it('can swap the fake clock time entirely', () => {
      const fake = makeFakeClock(Date.UTC(2000, 0, 1, 0, 0, 0))
      expect(Instant.now(fake.clock).toIso()).toBe('2000-01-01T00:00:00Z')
      fake.set(Date.UTC(2001, 0, 1, 0, 0, 0))
      expect(Instant.now(fake.clock).toIso()).toBe('2001-01-01T00:00:00Z')
    })
  })
})
