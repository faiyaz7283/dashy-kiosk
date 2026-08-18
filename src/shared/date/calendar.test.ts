/**
 * Tests for shared/date/calendar — calendar-specific Temporal helpers.
 */

import { describe, expect, it } from 'vitest'
import {
  today,
  now,
  getWeekDays,
  getMonthGridDates,
  getDateKey,
  getMonthKey,
  getWeekKey,
  formatRelativeDay,
  getShortWeekday,
  eventDate,
} from './calendar'

describe('today', () => {
  it('returns a PlainDate', () => {
    const result = today()
    expect(result).toBeInstanceOf(Temporal.PlainDate)
  })

  it('returns the current date', () => {
    const result = today()
    const jsDate = new Date()
    expect(result.year).toBe(jsDate.getFullYear())
    expect(result.month).toBe(jsDate.getMonth() + 1)
    expect(result.day).toBe(jsDate.getDate())
  })
})

describe('now', () => {
  it('returns a PlainTime', () => {
    const result = now()
    expect(result).toBeInstanceOf(Temporal.PlainTime)
  })

  it('returns a reasonable time', () => {
    const result = now()
    expect(result.hour).toBeGreaterThanOrEqual(0)
    expect(result.hour).toBeLessThan(24)
    expect(result.minute).toBeGreaterThanOrEqual(0)
    expect(result.minute).toBeLessThan(60)
  })
})

describe('getWeekDays', () => {
  it('returns 7 days', () => {
    const date = Temporal.PlainDate.from('2026-08-12') // Wednesday
    const week = getWeekDays(date)
    expect(week).toHaveLength(7)
  })

  it('starts on Monday', () => {
    const date = Temporal.PlainDate.from('2026-08-12') // Wednesday
    const week = getWeekDays(date)
    expect(week[0]!.dayOfWeek).toBe(1) // Monday
    expect(week[0]!.toString()).toBe('2026-08-10')
  })

  it('ends on Sunday', () => {
    const date = Temporal.PlainDate.from('2026-08-12') // Wednesday
    const week = getWeekDays(date)
    expect(week[6]!.dayOfWeek).toBe(7) // Sunday
    expect(week[6]!.toString()).toBe('2026-08-16')
  })

  it('handles Monday input', () => {
    const date = Temporal.PlainDate.from('2026-08-10') // Monday
    const week = getWeekDays(date)
    expect(week[0]!.toString()).toBe('2026-08-10')
    expect(week[6]!.toString()).toBe('2026-08-16')
  })

  it('handles Sunday input', () => {
    const date = Temporal.PlainDate.from('2026-08-16') // Sunday
    const week = getWeekDays(date)
    expect(week[0]!.toString()).toBe('2026-08-10')
    expect(week[6]!.toString()).toBe('2026-08-16')
  })

  it('handles month boundary', () => {
    const date = Temporal.PlainDate.from('2026-08-01') // Saturday
    const week = getWeekDays(date)
    expect(week[0]!.toString()).toBe('2026-07-27') // Monday of previous month
    expect(week[6]!.toString()).toBe('2026-08-02')
  })
})

describe('getMonthGridDates', () => {
  it('returns a multiple of 7 dates', () => {
    const ym = Temporal.PlainYearMonth.from('2026-08')
    const grid = getMonthGridDates(ym)
    expect(grid.length % 7).toBe(0)
  })

  it('returns at least 35 dates (5 weeks)', () => {
    const ym = Temporal.PlainYearMonth.from('2026-08')
    const grid = getMonthGridDates(ym)
    expect(grid.length).toBeGreaterThanOrEqual(35)
  })

  it('starts on Monday', () => {
    const ym = Temporal.PlainYearMonth.from('2026-08')
    const grid = getMonthGridDates(ym)
    expect(grid[0]!.dayOfWeek).toBe(1)
  })

  it('includes the first day of the month', () => {
    const ym = Temporal.PlainYearMonth.from('2026-08')
    const grid = getMonthGridDates(ym)
    const hasFirst = grid.some((d) => d.toString() === '2026-08-01')
    expect(hasFirst).toBe(true)
  })

  it('includes the last day of the month', () => {
    const ym = Temporal.PlainYearMonth.from('2026-08')
    const grid = getMonthGridDates(ym)
    const hasLast = grid.some((d) => d.toString() === '2026-08-31')
    expect(hasLast).toBe(true)
  })

  it('handles February in a leap year', () => {
    const ym = Temporal.PlainYearMonth.from('2024-02')
    const grid = getMonthGridDates(ym)
    const hasLeapDay = grid.some((d) => d.toString() === '2024-02-29')
    expect(hasLeapDay).toBe(true)
  })
})

describe('getDateKey', () => {
  it('returns ISO date string', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    expect(getDateKey(date)).toBe('2026-08-05')
  })

  it('pads single-digit month and day', () => {
    const date = Temporal.PlainDate.from('2026-01-05')
    expect(getDateKey(date)).toBe('2026-01-05')
  })
})

describe('getMonthKey', () => {
  it('returns YYYY-MM string', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    expect(getMonthKey(date)).toBe('2026-08')
  })

  it('pads single-digit month', () => {
    const date = Temporal.PlainDate.from('2026-01-15')
    expect(getMonthKey(date)).toBe('2026-01')
  })
})

describe('getWeekKey', () => {
  it('returns YYYY-W## string', () => {
    const date = Temporal.PlainDate.from('2026-08-10') // Week 33
    expect(getWeekKey(date)).toBe('2026-W33')
  })

  it('pads single-digit week number', () => {
    const date = Temporal.PlainDate.from('2026-01-05') // Week 2
    expect(getWeekKey(date)).toBe('2026-W02')
  })
})

describe('formatRelativeDay', () => {
  it('returns "Today" for today', () => {
    const todayDate = Temporal.PlainDate.from('2026-08-18')
    const result = formatRelativeDay(todayDate, todayDate)
    expect(result.dayLabel).toBe('Today')
    expect(result.dateLabel).toBe('Aug 18')
  })

  it('returns "Tomorrow" for tomorrow', () => {
    const todayDate = Temporal.PlainDate.from('2026-08-18')
    const tomorrow = Temporal.PlainDate.from('2026-08-19')
    const result = formatRelativeDay(tomorrow, todayDate)
    expect(result.dayLabel).toBe('Tomorrow')
    expect(result.dateLabel).toBe('Aug 19')
  })

  it('returns weekday name for other days', () => {
    const todayDate = Temporal.PlainDate.from('2026-08-18') // Tuesday
    const otherDay = Temporal.PlainDate.from('2026-08-20') // Thursday
    const result = formatRelativeDay(otherDay, todayDate)
    expect(result.dayLabel).toBe('Thu')
    expect(result.dateLabel).toBe('Aug 20')
  })
})

describe('getShortWeekday', () => {
  it('returns short weekday name', () => {
    const date = Temporal.PlainDate.from('2026-08-18') // Tuesday
    expect(getShortWeekday(date)).toBe('Tue')
  })

  it('returns "Mon" for Monday', () => {
    const date = Temporal.PlainDate.from('2026-08-17') // Monday
    expect(getShortWeekday(date)).toBe('Mon')
  })
})

describe('eventDate', () => {
  it('returns PlainDate unchanged', () => {
    const date = Temporal.PlainDate.from('2026-08-05')
    expect(eventDate(date)).toBe(date)
  })

  it('extracts date from PlainDateTime', () => {
    const dt = Temporal.PlainDateTime.from('2026-08-05T14:30:00')
    const result = eventDate(dt)
    expect(result).toBeInstanceOf(Temporal.PlainDate)
    expect(result.toString()).toBe('2026-08-05')
  })
})
