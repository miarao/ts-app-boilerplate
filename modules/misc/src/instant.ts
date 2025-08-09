import { addDays, addHours, addMilliseconds, addMinutes, addMonths, addSeconds, addYears } from 'date-fns'

export type DatePart = 'year' | 'month' | 'day' | 'weekday' // ISO weekday 1..7 (Mon=1)
export type TimePart = 'hour' | 'minute' | 'second'
export type ShiftUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

export interface Clock {
  now(): number
}
export const systemClock: Clock = { now: () => Date.now() }

export class Instant {
  private readonly ms: number

  private constructor(epochMs: number) {
    if (!Number.isFinite(epochMs)) {
      throw new Error('Invalid epoch ms')
    }
    // normalize to integer ms
    this.ms = Math.trunc(epochMs)
  }

  // Factory: now
  static now(clock: Clock = systemClock): Instant {
    return new Instant(clock.now())
  }

  // Factory: from mixed input, with explicit UTC rules
  static from(input: Date | string | number): Instant {
    if (input instanceof Date) {
      return new Instant(input.getTime())
    }
    if (typeof input === 'number') {
      return new Instant(input)
    }

    const s = input.trim()
    const hasOffset = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s)
    let normalized = s
    if (!hasOffset) {
      // date-only => UTC midnight; datetime without offset => treat as UTC
      normalized = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : `${s}Z`
    }
    const ms = Date.parse(normalized)
    if (Number.isNaN(ms)) {
      throw new Error(`Invalid ISO date string: ${input}`)
    }
    return new Instant(ms)
  }

  // Factory: from UTC calendar parts
  static fromUtcParts(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  ): Instant {
    return new Instant(Date.UTC(year, month - 1, day, hour, minute, second, millisecond))
  }

  // Value accessors
  epochMs(): number {
    return this.ms
  }
  toDate(): Date {
    return new Date(this.ms)
  }

  // ISO-8601 UTC string without fractional seconds by default
  toIso({ trimMillis = true }: { trimMillis?: boolean } = {}): string {
    const s = new Date(this.ms).toISOString()
    return trimMillis ? s.replace(/\.\d{3}Z$/, 'Z') : s
  }

  // JSON serialization
  toJSON(): string {
    return this.toIso()
  }

  // Primitive conversion for comparisons if someone does Number(i)
  [Symbol.toPrimitive](hint: 'number' | 'string' | 'default') {
    return hint === 'number' ? this.ms : this.toIso()
  }

  // Comparisons
  compare(other: Instant): -1 | 0 | 1 {
    return this.ms < other.ms ? -1 : this.ms > other.ms ? 1 : 0
  }
  isBefore(other: Instant): boolean {
    return this.ms < other.ms
  }
  isAfter(other: Instant): boolean {
    return this.ms > other.ms
  }
  equals(other: Instant): boolean {
    return this.ms === other.ms
  }

  // Shifting
  shift(amount: number, unit: ShiftUnit): Instant {
    const d = new Date(this.ms)
    switch (unit) {
      case 'years':
        return new Instant(addYears(d, amount).getTime())
      case 'months':
        return new Instant(addMonths(d, amount).getTime())
      case 'days':
        return new Instant(addDays(d, amount).getTime())
      case 'hours':
        return new Instant(addHours(d, amount).getTime())
      case 'minutes':
        return new Instant(addMinutes(d, amount).getTime())
      case 'seconds':
        return new Instant(addSeconds(d, amount).getTime())
      case 'milliseconds':
      default:
        return new Instant(addMilliseconds(d, amount).getTime())
    }
  }

  // UTC calendar helpers
  startOfUtcDay(): Instant {
    const d = new Date(this.ms)
    return new Instant(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  }
  isSameUtcDay(other: Instant): boolean {
    return this.startOfUtcDay().ms === other.startOfUtcDay().ms
  }
  daysBetweenUtc(other: Instant): number {
    const A = this.startOfUtcDay().ms
    const B = other.startOfUtcDay().ms
    return Math.abs((A - B) / 86_400_000) | 0
  }

  // UTC field getters
  datePart(part: DatePart): number {
    const d = new Date(this.ms)
    switch (part) {
      case 'year':
        return d.getUTCFullYear()
      case 'month':
        return d.getUTCMonth() + 1
      case 'day':
        return d.getUTCDate()
      case 'weekday': {
        // ISO weekday: Monday=1..Sunday=7
        const w = d.getUTCDay() // Sun=0..Sat=6
        return w === 0 ? 7 : w
      }
    }
  }
  timePart(part: TimePart): number {
    const d = new Date(this.ms)
    switch (part) {
      case 'hour':
        return d.getUTCHours()
      case 'minute':
        return d.getUTCMinutes()
      case 'second':
        return d.getUTCSeconds()
    }
  }

  // Stringification
  toString(): string {
    return this.toIso()
  }

  valueOf(): number {
    return this.ms
  }
}
