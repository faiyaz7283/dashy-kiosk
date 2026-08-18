/**
 * Tests for shared/date/format — display formatting for Temporal types.
 */

import { describe, expect, it } from 'vitest'
import {
  getOrdinalSuffix,
  formatHeaderDate,
  formatTime,
  formatDateTime,
  formatDateParts,
  formatDateWithOrdinal,
} from './format'

describe('getOrdinalSuffix', () => {
  it('returns "st" for 1, 21, 31', () => {
    expect(getOrdinalSuffix(1)).toBe('st')
    expect(getOrdinalSuffix(21)).toBe('st')
    expect(getOrdinalSuffix(31)).toBe('st')
  })

  it('returns "nd" for 2, 22', () => {
    expect(getOrdinalSuffix(2)).toBe('nd')
    expect(getOrdinalSuffix(22)).toBe('nd')
  })

  it('returns "rd" for 3, 23', () => {
    expect(getOrdinalSuffix(3)).toBe('rd')
    expect(getOrdinalSuffix(23)).toBe('rd')
  })

  it('returns "th" for 4-20, 24-30', () => {
    expect(getOrdinalSuffix(4)).toBe('th')
    expect(getOrdinalSuffix(10)).toBe('th')
    expect(getOrdinalSuffix(11)).toBe('th')
    expect(getOrdinalSuffix(12)).toBe('th')
    expect(getOrdinalSuffix(13)).toBe('th')
    expect(getOrdinalSuffix(14)).toBe('th')
    expect(getOrdinalSuffix(20)).toBe('th')
    expect(getOrdinalSuffix(24)).toBe('th')
    expect(getOrdinalSuffix(30)).toBe('th')
  })
})

describe('formatHeaderDate', () => {
  it('formats a date with weekday, month, and ordinal day', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    const result = formatHeaderDate(date)
    expect(result).toBe('Wed, Aug 5th')
  })

  it('formats the first of the month', () => {
    const date = Temporal.PlainDate.from('2026-03-01')
    const result = formatHeaderDate(date)
    expect(result).toBe('Sun, Mar 1st')
  })

  it('formats the eleventh with "th" suffix', () => {
    const date = Temporal.PlainDate.from('2026-01-11')
    const result = formatHeaderDate(date)
    expect(result).toBe('Sun, Jan 11th')
  })
})

describe('formatTime', () => {
  it('formats afternoon time in 12-hour format', () => {
    const time = Temporal.PlainTime.from('14:30')
    expect(formatTime(time)).toBe('2:30 PM')
  })

  it('formats morning time', () => {
    const time = Temporal.PlainTime.from('09:00')
    expect(formatTime(time)).toBe('9:00 AM')
  })

  it('formats noon', () => {
    const time = Temporal.PlainTime.from('12:00')
    expect(formatTime(time)).toBe('12:00 PM')
  })

  it('formats midnight', () => {
    const time = Temporal.PlainTime.from('00:00')
    expect(formatTime(time)).toBe('12:00 AM')
  })
})

describe('formatDateTime', () => {
  it('formats with full date parts', () => {
    const dt = Temporal.PlainDateTime.from('2026-08-05T14:30:00')
    const result = formatDateTime(dt, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toBe('Wednesday, August 5, 2026')
  })

  it('formats with date and time', () => {
    const dt = Temporal.PlainDateTime.from('2026-08-05T09:00:00')
    const result = formatDateTime(dt, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    expect(result).toContain('Aug')
    expect(result).toContain('5')
    expect(result).toContain('9:00')
  })
})

describe('formatDateParts', () => {
  it('formats short weekday and month', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    const result = formatDateParts(date, { weekday: 'short', month: 'short', day: 'numeric' })
    expect(result).toBe('Wed, Aug 5')
  })

  it('formats month and year only', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    const result = formatDateParts(date, { month: 'long', year: 'numeric' })
    expect(result).toBe('August 2026')
  })
})

describe('formatDateWithOrdinal', () => {
  it('adds ordinal suffix to day', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    const result = formatDateWithOrdinal(date, { month: 'short', day: 'numeric' })
    expect(result).toBe('Aug 5th')
  })

  it('handles 11th correctly', () => {
    const date = Temporal.PlainDate.from('2026-08-11')
    const result = formatDateWithOrdinal(date, { month: 'short', day: 'numeric' })
    expect(result).toBe('Aug 11th')
  })

  it('handles 21st correctly', () => {
    const date = Temporal.PlainDate.from('2026-08-21')
    const result = formatDateWithOrdinal(date, { month: 'short', day: 'numeric' })
    expect(result).toBe('Aug 21st')
  })
})
