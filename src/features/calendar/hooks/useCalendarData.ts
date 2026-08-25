/**
 * Hook for accessing calendar data via the context provider.
 *
 * Reads from CalendarDataContext instead of fetching directly.
 * The CalendarDataProvider (in AppShell) handles all fetching, caching,
 * and background refresh via React Query.
 *
 * This hook exists for backward compatibility — views call useCalendarData()
 * and receive cached data from the context provider above them.
 */

import { useCalendarContext } from '../context/CalendarDataContext'
import type { CalendarView } from '@/types/calendar'

/**
 * Accesses cached calendar event data from the context provider.
 *
 * The view and date parameters are accepted for API compatibility but
 * are ignored — the provider manages the active view/date range.
 *
 * @param _currentView - Unused (provider manages the active view).
 * @param _currentDate - Unused (provider manages the active date).
 * @returns Calendar events, loading states, and error info from context.
 */
export function useCalendarData(_currentView: CalendarView, _currentDate: Temporal.PlainDate) {
  return useCalendarContext()
}
