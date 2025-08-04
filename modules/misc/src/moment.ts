import {
  addDays,
  addHours,
  addMilliseconds,
  addMinutes,
  addMonths,
  addSeconds,
  addYears,
  isValid,
  parseISO,
} from 'date-fns'

export type DatePart = 'year' | 'month' | 'day' | 'weekday'
export type TimePart = 'hour' | 'minute' | 'second'
export type ShiftUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds'

/**
 * Moment — A lightweight, UTC-based wrapper around JS Date.
 */
export class Moment {
  readonly millis
  private readonly date: Date

  // For testing:
  private static _fakeNow?: Date
  private static _measureStart?: number

  constructor(input?: Date | string | number) {
    if (input == null) {
      this.date = new Date()
      this.millis = this.date.getTime()
    } else if (typeof input === 'string') {
      const parsed = parseISO(input)
      if (!isValid(parsed)) {
        throw new Error(`Invalid ISO date string: ${input}`)
      }
      this.date = parsed
      this.millis = parsed.getTime()
    } else if (typeof input === 'number') {
      this.date = new Date(input)
      this.millis = input
    } else if (input instanceof Date) {
      this.date = new Date(input.getTime())
      this.millis = input.getTime()
    } else {
      throw new Error(`Unsupported input type: ${typeof input}`)
    }
  }

  /** Returns “now”, or the faked time if ticked. */
  static now(): Moment {
    if (Moment._fakeNow) {
      return new Moment(Moment._fakeNow)
    }
    return new Moment()
  }

  /**
   * Advance the fake clock by amount (for testing).
   */
  static tick(amount: number, unit?: ShiftUnit): void {
    const base = Moment._fakeNow ? new Moment(Moment._fakeNow) : new Moment()
    const shifted = base.shiftBy(amount, unit)
    Moment._fakeNow = shifted.toNativeDate()
  }

  /**
   * Measure elapsed ms. First call ⇒ 0; subsequent ⇒ delta ms.
   */
  static measure(): number {
    const nowMs = Moment.now().toNativeDate().getTime()
    if (Moment._measureStart == null) {
      Moment._measureStart = nowMs
      return 0
    }
    return nowMs - Moment._measureStart
  }

  /** Clear fake clock and measurement. */
  static reset(): void {
    Moment._fakeNow = undefined
    Moment._measureStart = undefined
  }

  /** From year/month/day *in UTC*. */
  static fromParts(year: number, month: number, day: number): Moment {
    // Date.UTC returns a timestamp at 00:00 UTC
    return new Moment(Date.UTC(year, month - 1, day))
  }

  /** Alias for new Moment(iso) */
  static parseIso(isoString: string): Moment {
    return new Moment(isoString)
  }

  /** Expose the native Date (clone). */
  toNativeDate(): Date {
    return new Date(this.date.getTime())
  }

  /** ISO-8601 UTC string, without fractional seconds. */
  toIsoString(): string {
    return this.date
      .toISOString() // e.g. "2021-06-15T12:30:45.000Z"
      .replace(/\.\d{3}Z$/, 'Z')
  }

  /**
   * Simple UTC-based formatting for common tokens.
   * Supports: yyyy, MM, dd, HH, mm, ss
   */
  format(fmt: string): string {
    const utc = this.date
    const map: Record<string, string> = {
      yyyy: utc.getUTCFullYear().toString().padStart(4, '0'),
      MM: (utc.getUTCMonth() + 1).toString().padStart(2, '0'),
      dd: utc.getUTCDate().toString().padStart(2, '0'),
      HH: utc.getUTCHours().toString().padStart(2, '0'),
      mm: utc.getUTCMinutes().toString().padStart(2, '0'),
      ss: utc.getUTCSeconds().toString().padStart(2, '0'),
    }
    return fmt.replace(/yyyy|MM|dd|HH|mm|ss/g, token => map[token])
  }

  /** UTC field getters. */
  datePart(part: DatePart): number {
    switch (part) {
      case 'year':
        return this.date.getUTCFullYear()
      case 'month':
        return this.date.getUTCMonth() + 1
      case 'day':
        return this.date.getUTCDate()
      case 'weekday':
        return this.date.getUTCDay() + 1 // Sunday = 1…Saturday = 7
    }
  }

  timePart(part: TimePart): number {
    switch (part) {
      case 'hour':
        return this.date.getUTCHours()
      case 'minute':
        return this.date.getUTCMinutes()
      case 'second':
        return this.date.getUTCSeconds()
    }
  }

  /** Shift in absolute UTC ms. */
  shiftBy(amount: number, unit?: ShiftUnit): Moment {
    let shifted: Date
    switch (unit) {
      case 'years':
        shifted = addYears(this.date, amount)
        break
      case 'months':
        shifted = addMonths(this.date, amount)
        break
      case 'days':
        shifted = addDays(this.date, amount)
        break
      case 'hours':
        shifted = addHours(this.date, amount)
        break
      case 'minutes':
        shifted = addMinutes(this.date, amount)
        break
      case 'seconds':
        shifted = addSeconds(this.date, amount)
        break
      default:
        shifted = addMilliseconds(this.date, amount)
        break
    }
    return new Moment(shifted)
  }

  isBefore(other: Moment): boolean {
    return this.date.getTime() < other.date.getTime()
  }

  isAfter(other: Moment): boolean {
    return this.date.getTime() > other.date.getTime()
  }

  /** Same UTC calendar day? */
  isSameDay(other: Moment): boolean {
    return (
      this.datePart('year') === other.datePart('year') &&
      this.datePart('month') === other.datePart('month') &&
      this.datePart('day') === other.datePart('day')
    )
  }

  /** Absolute full-day difference in UTC. */
  daysBetween(other: Moment): number {
    const msPerDay = 24 * 60 * 60 * 1000
    const diff = this.date.getTime() - other.date.getTime()
    return Math.abs(Math.floor(diff / msPerDay))
  }

  toString(): string {
    return this.toIsoString()
  }
}
