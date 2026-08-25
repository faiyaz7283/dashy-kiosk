/**
 * Hook for fetching calendar data via the API.
 *
 * Uses the useApi hook with silent background refresh to avoid UI flicker.
 * Computes the appropriate date range for the current view (day/week/month/year),
 * and passes it as query parameters to the API.
 *
 * @param currentView - The active calendar view.
 * @param currentDate - The currently selected date.
 * @returns Calendar events, loading states, and error info.
 */

import { useApi } from '@/shared/hooks/useApi'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseCalendarEvent, type RawCalendarEvent } from '@/shared/date/parse'
import { getWeekDays } from '@/shared/date/calendar'
import type { CalendarEvent } from '@/types/calendar'
import type { CalendarView } from '@/types/calendar'

/** Calendar API response shape. */
interface CalendarApiResponse {
  events: RawCalendarEvent[]
}

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
 * Fetches and manages calendar event data.
 *
 * @param currentView - The active calendar view.
 * @param currentDate - The currently selected date.
 * @returns Calendar events, loading states, and error info.
 */
export function useCalendarData(currentView: CalendarView, currentDate: Temporal.PlainDate) {
  const { startDate, endDate } = computeDateRange(currentView, currentDate)

  const { data, isLoading, isRefreshing, error, refetch, lastRefresh } = useApi<CalendarApiResponse>(
    async () => {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
      const response = await fetch(`${ENDPOINTS.calendar.url}?${params}`)
      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`)
      }
      return response.json()
    },
    {
      refetchInterval: ENDPOINTS.calendar.refreshInterval,
    },
  )

  // Parse raw events into typed CalendarEvent objects
  const events: CalendarEvent[] = data?.events?.map(parseCalendarEvent) ?? []

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastRefresh,
  }
}
