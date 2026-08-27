/**
 * Calendar data context — provides cached calendar events to all views.
 *
 * The provider lives above the view switcher in AppShell so calendar data
 * persists across day/week/month/year view changes. React Query handles
 * caching, deduplication, and background refresh.
 *
 * Views read from this context via `useCalendarData()` instead of fetching
 * independently. Switching back to a previously viewed date range serves
 * cached data instantly (within staleTime window).
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseApiError } from '@/shared/errors'
import { parseCalendarEvent, type RawCalendarEvent } from '@/shared/date/parse'
import { getWeekDays } from '@/shared/date/calendar'
import { useConfig } from '@/shared/date/timezone'
import type { CalendarEvent } from '@/types/calendar'
import type { CalendarView } from '@/types/calendar'

/** Calendar API response shape. */
interface CalendarApiResponse {
  events: RawCalendarEvent[]
}

/** Calendar data context value provided to consumers. */
export interface CalendarDataContextValue {
  /** Parsed calendar events for the current date range. */
  events: CalendarEvent[]
  /** True only during the initial fetch (first load). */
  isLoading: boolean
  /** True during background refreshes (silent — data stays visible). */
  isRefreshing: boolean
  /** Error message from the last failed fetch, or null. */
  error: string | null
  /** Manually trigger a refetch. */
  refetch: () => void
  /** Timestamp (ms) of the last successful fetch. */
  lastRefresh: number | null
}

const CalendarDataContext = createContext<CalendarDataContextValue | null>(null)

/** Calendar data is considered fresh for 60 seconds. */
const CALENDAR_STALE_TIME_MS = 60_000

/** Calendar data is refetched every 2 minutes in the background. */
const CALENDAR_REFETCH_INTERVAL_MS = 120_000

/**
 * Computes the start and end dates for a given view and current date.
 *
 * @param view - The calendar view type.
 * @param currentDate - The currently selected date.
 * @returns An object with startDate and endDate as ISO date strings.
 */
function computeDateRange(
  view: CalendarView,
  currentDate: Temporal.PlainDate,
): { startDate: string; endDate: string } {
  switch (view) {
    case 'day': {
      const iso = currentDate.toString()
      return { startDate: iso, endDate: iso }
    }
    case 'week': {
      const weekDays = getWeekDays(currentDate)
      return {
        startDate: weekDays[0]!.toString(),
        endDate: weekDays[6]!.toString(),
      }
    }
    case 'month': {
      const firstDay = currentDate.with({ day: 1 })
      const lastDay = currentDate.with({ day: currentDate.daysInMonth })
      return {
        startDate: firstDay.toString(),
        endDate: lastDay.toString(),
      }
    }
    case 'year': {
      const firstDay = currentDate.with({ month: 1, day: 1 })
      const lastDay = currentDate.with({ month: 12, day: 31 })
      return {
        startDate: firstDay.toString(),
        endDate: lastDay.toString(),
      }
    }
  }
}

/**
 * Fetches calendar events from the API for a given date range.
 *
 * @param startDate - Start date as ISO string (YYYY-MM-DD).
 * @param endDate - End date as ISO string (YYYY-MM-DD).
 * @returns Parsed calendar API response.
 * @throws {ApiError} When the API returns a non-ok response.
 */
async function fetchCalendar(startDate: string, endDate: string): Promise<CalendarApiResponse> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  const response = await fetch(`${ENDPOINTS.calendar.url}?${params}`)
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/** Props for the CalendarDataProvider component. */
export interface CalendarDataProviderProps {
  /** The active calendar view (day/week/month/year). */
  currentView: CalendarView
  /** The currently selected date. */
  currentDate: Temporal.PlainDate
  /** Child components that consume calendar data. */
  children: ReactNode
}

/**
 * Provides cached calendar data to all child components.
 *
 * Uses React Query with `keepPreviousData` so navigating between date ranges
 * shows old data while new data loads (no skeleton flash). The query key
 * includes the date range, so switching back to a previously viewed range
 * serves cached data instantly.
 *
 * @param props - Provider props with current view, date, and children.
 * @returns Calendar data context provider.
 */
export function CalendarDataProvider({ currentView, currentDate, children }: CalendarDataProviderProps) {
  const { startDate, endDate } = computeDateRange(currentView, currentDate)
  const { timezone } = useConfig()

  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery<CalendarApiResponse>({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => fetchCalendar(startDate, endDate),
    staleTime: CALENDAR_STALE_TIME_MS,
    refetchInterval: CALENDAR_REFETCH_INTERVAL_MS,
    placeholderData: keepPreviousData,
  })

  const events: CalendarEvent[] = data?.events?.map(e => parseCalendarEvent(e, timezone)) ?? []

  return (
    <CalendarDataContext.Provider
      value={{
        events,
        isLoading,
        isRefreshing: isFetching && !isLoading,
        error: error instanceof Error ? error.message : null,
        refetch: () => { refetch() },
        lastRefresh: dataUpdatedAt > 0 ? dataUpdatedAt : null,
      }}
    >
      {children}
    </CalendarDataContext.Provider>
  )
}

/**
 * Access calendar data from the context provider.
 *
 * Must be used within a `CalendarDataProvider`. Throws if used outside
 * the provider to catch misconfiguration early.
 *
 * @returns Calendar data context value with events, loading states, and controls.
 */
export function useCalendarContext(): CalendarDataContextValue {
  const context = useContext(CalendarDataContext)
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarDataProvider')
  }
  return context
}
