/**
 * Tests for shared/date/parse — API wire-format string parsers.
 */

import { describe, expect, it } from 'vitest'
import {
  parseEventStart,
  parseEventEnd,
  parseForecastDate,
  parseWeatherTime,
  parseQueryDate,
  parseCalendarEvent,
  parseWeekCalendar,
  type RawCalendarEvent,
  type RawWeekCalendar,
} from './parse'

describe('parseEventStart', () => {
  it('parses all-day event as PlainDate', () => {
    const result = parseEventStart('2026-08-08', true)
    expect(result).toBeInstanceOf(Temporal.PlainDate)
    expect(result.toString()).toBe('2026-08-08')
  })

  it('parses timed event as PlainDateTime', () => {
    const result = parseEventStart('2026-08-08T14:00:00', false)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect(result.toString()).toBe('2026-08-08T14:00:00')
  })

  it('preserves hours and minutes for timed events', () => {
    const result = parseEventStart('2026-08-08T09:30:00', false) as Temporal.PlainDateTime
    expect(result.hour).toBe(9)
    expect(result.minute).toBe(30)
  })

  it('preserves year/month/day for all-day events', () => {
    const result = parseEventStart('2026-01-15', true) as Temporal.PlainDate
    expect(result.year).toBe(2026)
    expect(result.month).toBe(1)
    expect(result.day).toBe(15)
  })

  it('strips UTC "Z" designator from timed events', () => {
    const result = parseEventStart('2026-08-08T14:00:00Z', false) as Temporal.PlainDateTime
    expect(result.toString()).toBe('2026-08-08T14:00:00')
  })

  it('strips timezone offset from timed events', () => {
    const result = parseEventStart('2026-08-08T14:00:00-04:00', false) as Temporal.PlainDateTime
    expect(result.toString()).toBe('2026-08-08T14:00:00')
  })

  it('strips positive timezone offset from timed events', () => {
    const result = parseEventStart('2026-08-08T14:00:00+05:30', false) as Temporal.PlainDateTime
    expect(result.toString()).toBe('2026-08-08T14:00:00')
  })
})

describe('parseEventEnd', () => {
  it('parses all-day event end as PlainDate', () => {
    const result = parseEventEnd('2026-08-10', true)
    expect(result).toBeInstanceOf(Temporal.PlainDate)
    expect(result.toString()).toBe('2026-08-10')
  })

  it('parses timed event end as PlainDateTime', () => {
    const result = parseEventEnd('2026-08-08T17:00:00', false)
    expect(result).toBeInstanceOf(Temporal.PlainDateTime)
    expect(result.toString()).toBe('2026-08-08T17:00:00')
  })
})

describe('parseForecastDate', () => {
  it('parses YYYY-MM-DD to PlainDate', () => {
    const result = parseForecastDate('2026-08-08')
    expect(result).toBeInstanceOf(Temporal.PlainDate)
    expect(result.year).toBe(2026)
    expect(result.month).toBe(8)
    expect(result.day).toBe(8)
  })

  it('parses single-digit month and day', () => {
    const result = parseForecastDate('2026-01-05')
    expect(result.month).toBe(1)
    expect(result.day).toBe(5)
  })
})

describe('parseWeatherTime', () => {
  it('parses HH:MM format to PlainTime', () => {
    const result = parseWeatherTime('06:30')
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(6)
    expect(result.minute).toBe(30)
  })

  it('parses ISO datetime and extracts time portion', () => {
    const result = parseWeatherTime('2026-08-08T14:45:00')
    expect(result).toBeInstanceOf(Temporal.PlainTime)
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(45)
  })

  it('handles midnight', () => {
    const result = parseWeatherTime('00:00')
    expect(result.hour).toBe(0)
    expect(result.minute).toBe(0)
  })

  it('handles end of day', () => {
    const result = parseWeatherTime('23:59')
    expect(result.hour).toBe(23)
    expect(result.minute).toBe(59)
  })

  it('strips UTC "Z" designator from ISO datetime', () => {
    const result = parseWeatherTime('2026-08-08T14:45:00Z')
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(45)
  })

  it('strips timezone offset from ISO datetime', () => {
    const result = parseWeatherTime('2026-08-08T14:45:00-04:00')
    expect(result.hour).toBe(14)
    expect(result.minute).toBe(45)
  })
})

describe('parseQueryDate', () => {
  it('parses YYYY-MM-DD to PlainDate', () => {
    const result = parseQueryDate('2026-12-25')
    expect(result).toBeInstanceOf(Temporal.PlainDate)
    expect(result.toString()).toBe('2026-12-25')
  })
})

describe('parseCalendarEvent', () => {
  it('parses an all-day event with PlainDate start/end', () => {
    const raw: RawCalendarEvent = {
      id: 'evt-1',
      title: 'Team Offsite',
      start: '2026-08-15',
      end: '2026-08-15',
      all_day: true,
      members: ['alice'],
    }
    const event = parseCalendarEvent(raw)
    expect(event.all_day).toBe(true)
    expect(event.start).toBeInstanceOf(Temporal.PlainDate)
    expect(event.end).toBeInstanceOf(Temporal.PlainDate)
    expect(event.start.toString()).toBe('2026-08-15')
    expect(event.end.toString()).toBe('2026-08-15')
  })

  it('parses a timed event with PlainDateTime start/end', () => {
    const raw: RawCalendarEvent = {
      id: 'evt-2',
      title: 'Standup',
      start: '2026-08-15T09:00:00',
      end: '2026-08-15T09:30:00',
      all_day: false,
      members: ['bob'],
    }
    const event = parseCalendarEvent(raw)
    expect(event.all_day).toBe(false)
    expect(event.start).toBeInstanceOf(Temporal.PlainDateTime)
    expect(event.end).toBeInstanceOf(Temporal.PlainDateTime)
    expect(event.start.toString()).toBe('2026-08-15T09:00:00')
    expect(event.end.toString()).toBe('2026-08-15T09:30:00')
  })

  it('treats missing all_day as timed event', () => {
    const raw: RawCalendarEvent = {
      id: 'evt-3',
      title: 'Lunch',
      start: '2026-08-15T12:00:00',
      end: '2026-08-15T13:00:00',
      members: ['carol'],
    }
    const event = parseCalendarEvent(raw)
    expect(event.all_day).toBe(false)
    expect(event.start).toBeInstanceOf(Temporal.PlainDateTime)
  })

  it('preserves all other event fields', () => {
    const raw: RawCalendarEvent = {
      id: 'evt-4',
      title: 'Planning',
      start: '2026-08-15T14:00:00',
      end: '2026-08-15T15:00:00',
      all_day: false,
      members: ['alice', 'bob'],
      location: 'Room A',
      description: 'Sprint planning',
      organizer: 'alice',
      recurrence_rule: 'FREQ=WEEKLY',
    }
    const event = parseCalendarEvent(raw)
    expect(event.id).toBe('evt-4')
    expect(event.title).toBe('Planning')
    expect(event.members).toEqual(['alice', 'bob'])
    expect(event.location).toBe('Room A')
    expect(event.description).toBe('Sprint planning')
    expect(event.organizer).toBe('alice')
    expect(event.recurrence_rule).toBe('FREQ=WEEKLY')
  })
})

describe('parseWeekCalendar', () => {
  it('parses week boundaries and all events', () => {
    const raw: RawWeekCalendar = {
      week_start: '2026-08-10',
      week_end: '2026-08-16',
      events: [
        {
          id: 'evt-1',
          title: 'All Day',
          start: '2026-08-12',
          end: '2026-08-12',
          all_day: true,
          members: ['alice'],
        },
        {
          id: 'evt-2',
          title: 'Meeting',
          start: '2026-08-12T10:00:00',
          end: '2026-08-12T11:00:00',
          all_day: false,
          members: ['bob'],
        },
      ],
    }
    const week = parseWeekCalendar(raw)
    expect(week.week_start).toBeInstanceOf(Temporal.PlainDate)
    expect(week.week_end).toBeInstanceOf(Temporal.PlainDate)
    expect(week.week_start.toString()).toBe('2026-08-10')
    expect(week.week_end.toString()).toBe('2026-08-16')
    expect(week.events).toHaveLength(2)
    expect(week.events[0]!.all_day).toBe(true)
    expect(week.events[1]!.all_day).toBe(false)
  })

  it('handles empty events array', () => {
    const raw: RawWeekCalendar = {
      week_start: '2026-08-10',
      week_end: '2026-08-16',
      events: [],
    }
    const week = parseWeekCalendar(raw)
    expect(week.events).toEqual([])
  })
})
