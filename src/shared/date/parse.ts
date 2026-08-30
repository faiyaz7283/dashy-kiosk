/**
 * Parse API wire-format date strings into Temporal types.
 *
 * The backend sends dates in several formats depending on the data source:
 * - Calendar events: `"2026-08-08"` (all-day) or `"2026-08-08T14:00:00"` (timed)
 * - Weather forecasts: `"2026-08-08"` (daily), `"2026-08-08T14:00:00"` (hourly)
 * - Sunrise/sunset: `"HH:MM"` or full ISO datetime
 *
 * Each parser is typed to return the correct Temporal type for its domain concept,
 * so callers never need to guess whether they have a date, time, or datetime.
 *
 * All times are converted to the configured timezone (from useConfig hook).
 */

import type { CalendarEvent, WeekCalendar } from '@/types/calendar'
import { convertUtcToTimezone } from './timezone'

/**
 * Strips timezone designators from an ISO datetime string.
 *
 * Google Calendar API returns datetimes with timezone info (e.g., "Z" or "-04:00").
 * Temporal.PlainDateTime doesn't accept timezone designators, so we strip them.
 * The backend handles timezone conversions; the frontend treats all times as local.
 *
 * @param iso - ISO datetime string, possibly with timezone.
 * @returns Datetime string without timezone designator.
 *
 * @example
 * ```ts
 * stripTimezone('2026-08-08T14:00:00Z')       // '2026-08-08T14:00:00'
 * stripTimezone('2026-08-08T14:00:00-04:00')  // '2026-08-08T14:00:00'
 * stripTimezone('2026-08-08T14:00:00')        // '2026-08-08T14:00:00'
 * ```
 */
function stripTimezone(iso: string): string {
  // Remove trailing "Z"
  if (iso.endsWith('Z')) {
    return iso.slice(0, -1)
  }
  // Remove timezone offset like "+00:00" or "-04:00"
  const tzMatch = iso.match(/([+-]\d{2}:\d{2})$/)
  if (tzMatch && tzMatch[1]) {
    return iso.slice(0, -tzMatch[1].length)
  }
  return iso
}

/** Raw calendar event from the API (before parsing). */
export interface RawCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  all_day?: boolean
  location?: string
  members: string[]
  description?: string | null
  organizer?: string | null
  attendees?: Array<{
    member_key: string | null
    email: string
    display_name: string
    status: 'accepted' | 'declined' | 'tentative' | 'needsAction'
    color: string
    color_key?: string | null
  }>
  recurring_event_id?: string | null
  is_recurring_instance?: boolean
  recurrence_rule?: string | null
}

/** Raw week calendar response from the API (before parsing). */
export interface RawWeekCalendar {
  week_start: string
  week_end: string
  events: RawCalendarEvent[]
}

/**
 * Parses a calendar event start string into the appropriate Temporal type.
 *
 * All-day events produce a PlainDate; timed events produce a PlainDateTime.
 * The `allDay` flag determines which parser to use.
 *
 * @param iso - ISO date string from the API.
 * @param allDay - Whether the event is an all-day event.
 * @returns PlainDate for all-day events, PlainDateTime for timed events.
 *
 * @example
 * ```ts
 * parseEventStart('2026-08-08', true)          // PlainDate(2026-08-08)
 * parseEventStart('2026-08-08T14:00:00', false) // PlainDateTime(2026-08-08T14:00:00)
 * ```
 */
export function parseEventStart(
  iso: string,
  allDay: boolean,
): Temporal.PlainDate | Temporal.PlainDateTime {
  return allDay ? Temporal.PlainDate.from(iso) : Temporal.PlainDateTime.from(stripTimezone(iso))
}

/**
 * Parses a calendar event end string into the appropriate Temporal type.
 *
 * Identical logic to {@link parseEventStart} — separated for call-site clarity.
 *
 * @param iso - ISO date string from the API.
 * @param allDay - Whether the event is an all-day event.
 * @returns PlainDate for all-day events, PlainDateTime for timed events.
 */
export function parseEventEnd(
  iso: string,
  allDay: boolean,
): Temporal.PlainDate | Temporal.PlainDateTime {
  return allDay ? Temporal.PlainDate.from(iso) : Temporal.PlainDateTime.from(stripTimezone(iso))
}

/**
 * Parses a weather forecast date string to a PlainDate.
 *
 * The backend sends daily forecast dates as `"YYYY-MM-DD"` in local timezone.
 *
 * @param dateStr - Date string in YYYY-MM-DD format.
 * @returns The parsed PlainDate.
 *
 * @example
 * ```ts
 * parseForecastDate('2026-08-08') // PlainDate(2026-08-08)
 * ```
 */
export function parseForecastDate(dateStr: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateStr)
}

/**
 * Parses a weather time string to a PlainTime in the configured timezone.
 *
 * Handles two formats from the backend:
 * - `"HH:MM"` — simple time in UTC (sunrise/sunset)
 * - `"YYYY-MM-DDTHH:MM:SS+00:00"` — full ISO datetime in UTC (hourly forecast)
 *
 * @param timeStr - Time string in HH:MM or ISO datetime format.
 * @param timezone - IANA timezone identifier (e.g., "America/New_York").
 * @returns The parsed PlainTime in the configured timezone.
 *
 * @example
 * ```ts
 * parseWeatherTime('06:30', 'America/New_York')                     // PlainTime(02:30) - UTC to EDT
 * parseWeatherTime('2026-08-08T14:00:00+00:00', 'America/New_York') // PlainTime(10:00) - UTC to EDT
 * ```
 */
export function parseWeatherTime(timeStr: string, timezone: string): Temporal.PlainTime {
  if (timeStr.includes('T')) {
    // Full ISO datetime - convert UTC to configured timezone
    const zoned = convertUtcToTimezone(timeStr, timezone)
    return zoned.toPlainTime()
  } else {
    // Simple HH:MM format - treat as UTC and convert to configured timezone
    const parts = timeStr.split(':')
    const hours = Number(parts[0])
    const minutes = Number(parts[1])

    // Create a ZonedDateTime for today in UTC with this time
    const todayUtc = Temporal.Now.zonedDateTimeISO('UTC')
    const utcZoned = todayUtc.with({
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
    
    // Convert to target timezone
    const localZoned = utcZoned.withTimeZone(timezone)
    return localZoned.toPlainTime()
  }
}

/**
 * Parses a date-range query parameter to a PlainDate.
 *
 * Used for constructing API query strings from the selected navigation date.
 *
 * @param dateStr - Date string in YYYY-MM-DD format.
 * @returns The parsed PlainDate.
 */
export function parseQueryDate(dateStr: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateStr)
}

/**
 * Parses a raw calendar event from the API into a typed CalendarEvent.
 *
 * Converts the string start/end fields to the appropriate Temporal type
 * based on the `all_day` flag. For timed events, converts UTC times to
 * the configured timezone.
 *
 * @param raw - The raw event from the API.
 * @param timezone - IANA timezone identifier (e.g., "America/New_York").
 * @returns A typed CalendarEvent with Temporal date/time fields in local timezone.
 *
 * @example
 * ```ts
 * const event = parseCalendarEvent({
 *   id: '123',
 *   title: 'Meeting',
 *   start: '2026-08-08T14:00:00Z',
 *   end: '2026-08-08T15:00:00Z',
 *   all_day: false,
 *   members: ['alice']
 * }, 'America/New_York')
 * // event.start is Temporal.PlainDateTime in local timezone
 * ```
 */
export function parseCalendarEvent(raw: RawCalendarEvent, timezone: string): CalendarEvent {
  const isAllDay = raw.all_day === true

  if (isAllDay) {
    return {
      ...raw,
      all_day: true,
      start: Temporal.PlainDate.from(raw.start),
      end: Temporal.PlainDate.from(raw.end),
    }
  }

  // Convert UTC times to configured timezone
  const startZoned = convertUtcToTimezone(raw.start, timezone)
  const endZoned = convertUtcToTimezone(raw.end, timezone)

  return {
    ...raw,
    all_day: false,
    start: startZoned.toPlainDateTime(),
    end: endZoned.toPlainDateTime(),
  }
}

/**
 * Parses a raw week calendar response from the API into a typed WeekCalendar.
 *
 * Converts all events and the week boundaries to Temporal types.
 * For timed events, converts UTC times to the configured timezone.
 *
 * @param raw - The raw response from the API.
 * @param timezone - IANA timezone identifier (e.g., "America/New_York").
 * @returns A typed WeekCalendar with Temporal date fields in local timezone.
 */
export function parseWeekCalendar(raw: RawWeekCalendar, timezone: string): WeekCalendar {
  return {
    week_start: Temporal.PlainDate.from(raw.week_start),
    week_end: Temporal.PlainDate.from(raw.week_end),
    events: raw.events.map(e => parseCalendarEvent(e, timezone)),
  }
}
