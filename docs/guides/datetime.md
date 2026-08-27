# Date/Time Handling Guide

**Status:** Active  
**Created:** 2026-08-26  
**Scope:** All frontend date/time handling

---

## Overview

Dashy follows a project-wide datetime standardization (see `docs/plans/DATETIME-STANDARDIZATION.md`). All API responses use UTC, and the frontend converts to the user's configured timezone for display.

**Key principle:** Backend sends UTC → Frontend converts to local timezone → Components display formatted local time.

---

## Wire Format: UTC Only

All API responses use UTC with timezone indicators:

| Type | Format | Example |
|------|--------|---------|
| **Timestamps** | ISO 8601 with UTC offset | `"2026-08-26T19:30:00+00:00"` or `"2026-08-26T19:30:00Z"` |
| **Dates** | ISO 8601 date (no time) | `"2026-08-26"` |
| **Times** | 24-hour HH:MM in UTC | `"18:00"` (no seconds, no timezone) |

**No exceptions.** All datetime values on the wire are UTC.

---

## Frontend Architecture

### 1. Configuration: Timezone from Backend

The user's timezone is configured in `.env` via `TIMEZONE` (IANA identifier, e.g., `"America/New_York"`). Frontend fetches this once on app load via `GET /api/v1/config`.

```typescript
import { useConfig } from '@/shared/date/timezone'

const { timezone } = useConfig()  // "America/New_York"
```

**Never hardcode a timezone.** Always use `useConfig()`.

### 2. Parse at the Boundary

Convert API responses to Temporal types **immediately** in the data layer (hooks, context providers, parse functions) — not in components.

```typescript
// ✅ Correct: Parse in data layer
function useCalendarData() {
  const { timezone } = useConfig()
  const { data } = useQuery({ /* ... */ })
  
  const events = data?.events?.map(e => parseCalendarEvent(e, timezone)) ?? []
  return { events }
}

// ❌ Wrong: Parse in component
function EventCard({ event }) {
  const start = new Date(event.start)  // FORBIDDEN
  // ...
}
```

### 3. Components Receive Temporal Types

Components should never parse ISO strings themselves. They receive already-parsed Temporal types via props.

```typescript
// ✅ Correct: Component receives Temporal type
interface EventCardProps {
  start: Temporal.PlainDateTime  // Already parsed
}

function EventCard({ start }: EventCardProps) {
  return <span>{formatTime(start)}</span>
}

// ❌ Wrong: Component parses ISO string
interface EventCardProps {
  start: string  // ISO string
}

function EventCard({ start }: EventCardProps) {
  const parsed = Temporal.PlainDateTime.from(start)  // FORBIDDEN in component
  return <span>{formatTime(parsed)}</span>
}
```

---

## Utilities: `src/shared/date/`

All date/time utilities live in `src/shared/date/` (not `src/shared/utils/`).

### File Organization

| File | Purpose | Examples |
|------|---------|----------|
| `timezone.ts` | Timezone config + UTC→local conversion | `useConfig()`, `convertUtcToTimezone()`, `formatUtcTime()` |
| `parse.ts` | API response parsing | `parseCalendarEvent()`, `parseWeatherTime()`, `parseEventStart()` |
| `calendar.ts` | Calendar-specific logic | `today()`, `getWeekDays()`, `getMonthGridDates()` |
| `format.ts` | General formatting | `formatTime()`, `formatDate()` |
| `index.ts` | Barrel export | Re-exports all utilities |

### When to Add New Utilities

- **Timezone conversion** → `timezone.ts`
- **API response parsing** → `parse.ts`
- **Calendar-specific logic** → `calendar.ts`
- **General formatting** → `format.ts`
- **Domain-specific (e.g., chores)** → Create new file (e.g., `chores.ts`) if it has 3+ utilities, otherwise add to `parse.ts`

---

## Core Utilities

### `useConfig()` Hook

Fetches the configured timezone from the backend.

```typescript
import { useConfig } from '@/shared/date/timezone'

const { timezone, isLoading, error } = useConfig()
// timezone: "America/New_York"
```

**Caching:** Config is cached for 1 hour (timezone rarely changes).

### `convertUtcToTimezone()`

Converts a UTC ISO datetime string to a `Temporal.ZonedDateTime` in the configured timezone.

```typescript
import { convertUtcToTimezone } from '@/shared/date/timezone'

const utcIso = '2026-08-26T19:30:00+00:00'
const local = convertUtcToTimezone(utcIso, 'America/New_York')
// Returns Temporal.ZonedDateTime for 3:30 PM EDT

const time = local.toPlainTime()  // Temporal.PlainTime(15:30:00)
const date = local.toPlainDate()  // Temporal.PlainDate(2026-08-26)
```

### `formatUtcTime()`

Formats a UTC ISO datetime as a local time string (e.g., "3:30 PM").

```typescript
import { formatUtcTime } from '@/shared/date/timezone'

const utcIso = '2026-08-26T19:30:00+00:00'
const formatted = formatUtcTime(utcIso, 'America/New_York')
// "3:30 PM"
```

### `parseCalendarEvent()`

Parses a raw calendar event from the API into a typed `CalendarEvent` with Temporal date/time fields.

```typescript
import { parseCalendarEvent } from '@/shared/date/parse'

const rawEvent = {
  id: '123',
  title: 'Meeting',
  start: '2026-08-26T19:30:00Z',
  end: '2026-08-26T20:30:00Z',
  all_day: false,
  members: ['faiyaz']
}

const event = parseCalendarEvent(rawEvent, 'America/New_York')
// event.start: Temporal.PlainDateTime(2026-08-26T15:30:00)
// event.end: Temporal.PlainDateTime(2026-08-26T16:30:00)
```

### `parseWeatherTime()`

Parses weather time strings (sunrise/sunset, hourly forecasts) to `Temporal.PlainTime` in the configured timezone.

```typescript
import { parseWeatherTime } from '@/shared/date/parse'

// Sunrise/sunset: HH:MM in UTC
const sunrise = parseWeatherTime('10:30', 'America/New_York')
// Temporal.PlainTime(06:30:00) — converted from 10:30 UTC to 6:30 AM EDT

// Hourly forecast: Full ISO datetime
const hourly = parseWeatherTime('2026-08-26T18:00:00+00:00', 'America/New_York')
// Temporal.PlainTime(14:00:00) — converted from 18:00 UTC to 2:00 PM EDT
```

---

## Domain-Specific Patterns

### Calendar

Calendar events are parsed in `CalendarDataContext` using `parseCalendarEvent()`. Components receive `CalendarEvent` objects with `start` and `end` as `Temporal.PlainDate` (all-day) or `Temporal.PlainDateTime` (timed).

```typescript
// In CalendarDataContext
const events = data?.events?.map(e => parseCalendarEvent(e, timezone)) ?? []

// In component
function EventCard({ event }: { event: CalendarEvent }) {
  const time = event.all_day 
    ? 'All day'
    : formatTime(event.start)  // "3:30 PM"
  return <div>{time}</div>
}
```

### Weather

Weather times (sunrise/sunset, hourly forecasts) are parsed using `parseWeatherTime()`.

```typescript
// In component
const { timezone } = useConfig()
const sunriseTime = parseWeatherTime(forecast.sunrise, timezone)
const formatted = formatTime(sunriseTime)  // "6:30 AM"
```

### Chores

Chores have additional time fields:
- `recurrence_rule.time` — HH:MM in UTC (e.g., "14:00" means 2:00 PM UTC)
- `due_time` — HH:MM in UTC (optional deadline)

**Display pattern:**

```typescript
import { formatRecurrenceTime } from '@/shared/date/chores'

const { timezone } = useConfig()
const displayTime = formatRecurrenceTime(master.recurrence_rule.time, timezone)
// "14:00" UTC → "10:00 AM" in America/New_York
```

**Note:** Backend timezone fix pending — `recurrence_rule.time` and `due_time` are currently compared against UTC clock but users enter them in local time. Backend will convert local→UTC on input. Frontend display logic remains the same.

---

## Rules

### 1. No `new Date()`

**Forbidden:** `new Date()`, `Date.now()`, `new Date(string)`

**Exception:** Timezone utilities (`src/shared/date/timezone.ts`) use `new Date()` internally for `Intl.DateTimeFormat`, which requires Date objects. This is the **only** place `Date` is allowed.

```typescript
// ✅ Correct
const now = Temporal.Now.plainDateISO()
const datetime = Temporal.PlainDateTime.from(isoString)

// ❌ Forbidden
const now = new Date()
const datetime = new Date(isoString)
```

### 2. Always Use Temporal API

Use `Temporal.PlainDate`, `Temporal.PlainDateTime`, `Temporal.PlainTime`, `Temporal.ZonedDateTime` for all date/time handling.

```typescript
// ✅ Correct
const date = Temporal.PlainDate.from('2026-08-26')
const time = Temporal.PlainTime.from('15:30:00')
const datetime = Temporal.PlainDateTime.from('2026-08-26T15:30:00')

// ❌ Forbidden
const date = '2026-08-26'  // Raw string
const time = '15:30'  // Raw string
```

### 3. Always Convert UTC → Timezone

Never display raw UTC times to users. Always convert to the configured timezone first.

```typescript
// ✅ Correct
const { timezone } = useConfig()
const local = convertUtcToTimezone(utcIso, timezone)
const formatted = formatUtcTime(utcIso, timezone)

// ❌ Forbidden
<span>{event.start}</span>  // Displays raw UTC
const time = utcIso.split('T')[1]  // Manual parsing
```

### 4. Parse at the Boundary

Convert API responses to Temporal types in the data layer (hooks, context), not in components.

```typescript
// ✅ Correct: Parse in hook
function useCalendarData() {
  const { timezone } = useConfig()
  const { data } = useQuery({ /* ... */ })
  const events = data?.events?.map(e => parseCalendarEvent(e, timezone)) ?? []
  return { events }
}

// ❌ Wrong: Parse in component
function EventCard({ event }) {
  const start = parseCalendarEvent(event, timezone)  // FORBIDDEN
  // ...
}
```

### 5. Components Receive Temporal Types

Components should never parse ISO strings themselves. They receive already-parsed Temporal types via props.

```typescript
// ✅ Correct
interface EventCardProps {
  start: Temporal.PlainDateTime  // Already parsed
}

// ❌ Wrong
interface EventCardProps {
  start: string  // ISO string — component must parse
}
```

---

## Common Patterns

### Pattern 1: Display a UTC Timestamp

```typescript
import { useConfig, formatUtcTime } from '@/shared/date/timezone'

function EventTimestamp({ iso }: { iso: string }) {
  const { timezone } = useConfig()
  return <span>{formatUtcTime(iso, timezone)}</span>
}
```

### Pattern 2: Display a UTC Time-of-Day (HH:MM)

```typescript
import { useConfig, formatUtcTimeOfDay } from '@/shared/date/timezone'

function SunriseTime({ utcTime }: { utcTime: string }) {
  const { timezone } = useConfig()
  return <span>{formatUtcTimeOfDay(utcTime, timezone)}</span>
}
```

### Pattern 3: Parse API Response in Hook

```typescript
import { useQuery } from '@tanstack/react-query'
import { useConfig } from '@/shared/date/timezone'
import { parseCalendarEvent } from '@/shared/date/parse'

function useCalendarData() {
  const { timezone } = useConfig()
  const { data } = useQuery({
    queryKey: ['calendar'],
    queryFn: fetchCalendar,
  })
  
  const events = data?.events?.map(e => parseCalendarEvent(e, timezone)) ?? []
  
  return { events }
}
```

### Pattern 4: Format a Temporal Type

```typescript
import { formatTime, formatDate } from '@/shared/date/format'

function EventCard({ start }: { start: Temporal.PlainDateTime }) {
  return (
    <div>
      <div>{formatDate(start)}</div>  // "Aug 26"
      <div>{formatTime(start)}</div>  // "3:30 PM"
    </div>
  )
}
```

---

## Testing

### What to Test

- **Parse functions** — verify UTC→local conversion with various timezones
- **Format functions** — verify Temporal types format correctly
- **Hook behavior** — verify `useConfig()` fetches and caches timezone

### What NOT to Test

- **Component rendering with dates** — components receive Temporal types, not ISO strings
- **Timezone edge cases** — Temporal API handles DST, leap years, etc.

### Example Test

```typescript
import { parseWeatherTime } from '@/shared/date/parse'

describe('parseWeatherTime', () => {
  it('converts UTC sunrise time to local timezone', () => {
    const utcTime = '10:30'  // 10:30 UTC
    const timezone = 'America/New_York'
    
    const local = parseWeatherTime(utcTime, timezone)
    
    // 10:30 UTC = 6:30 AM EDT (UTC-4)
    expect(local.hour).toBe(6)
    expect(local.minute).toBe(30)
  })
})
```

---

## Migration Checklist

When adding new date/time handling:

- [ ] API response uses UTC wire format (verify with backend)
- [ ] Parse function exists in `src/shared/date/parse.ts` (or create one)
- [ ] Parsing happens in data layer (hook/context), not component
- [ ] Component receives Temporal type via props
- [ ] Display uses `formatTime()`, `formatDate()`, or similar formatter
- [ ] No `new Date()` in component code
- [ ] No hardcoded timezone — uses `useConfig()`
- [ ] Test covers UTC→local conversion

---

## References

- **Datetime standardization plan:** `docs/plans/DATETIME-STANDARDIZATION.md`
- **Temporal API docs:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
- **IANA timezone database:** https://www.iana.com/time-zones
- **Backend config endpoint:** `GET /api/v1/config` returns `{ "timezone": "America/New_York" }`
