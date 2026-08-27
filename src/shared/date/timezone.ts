/**
 * Timezone utilities for converting UTC times to display timezone.
 *
 * The backend sends all datetime values in UTC. These utilities convert
 * them to the user's configured timezone for display.
 */

import { useQuery } from '@tanstack/react-query'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { setTimezone } from './calendar'

/** Config data is considered fresh for 1 hour (timezone rarely changes). */
const CONFIG_STALE_TIME_MS = 3_600_000

/**
 * Config API response shape.
 */
interface AppConfig {
  timezone: string
}

/**
 * Fetches application config from the API.
 *
 * @returns Application configuration including timezone.
 */
async function fetchConfig(): Promise<AppConfig> {
  const response = await fetch(ENDPOINTS.config.url)
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status}`)
  }
  return response.json()
}

/**
 * Hook for fetching application configuration.
 *
 * Returns the configured timezone from the backend.
 * Timezone is cached for 1 hour (rarely changes).
 * Also sets the timezone globally for date calculations.
 *
 * @returns Timezone string (e.g., "America/New_York"), loading state, error.
 */
export function useConfig() {
  const { data, isLoading, error } = useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: CONFIG_STALE_TIME_MS,
    refetchInterval: 0, // Fetch once on mount
  })

  // Set timezone globally when it's fetched
  if (data?.timezone) {
    setTimezone(data.timezone)
  }

  return {
    timezone: data?.timezone ?? 'UTC',
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

/**
 * Convert UTC ISO datetime to configured timezone.
 *
 * @param utcIso - UTC datetime in ISO 8601 format (e.g., "2026-08-26T18:00:00+00:00")
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Temporal.ZonedDateTime in the target timezone
 *
 * @example
 * ```ts
 * const utcTime = '2026-08-26T18:00:00+00:00'
 * const local = convertUtcToTimezone(utcTime, 'America/New_York')
 * // Returns Temporal.ZonedDateTime for 2:00 PM EDT
 * ```
 */
export function convertUtcToTimezone(
  utcIso: string,
  timezone: string
): Temporal.ZonedDateTime {
  // Parse as Instant (absolute point in time)
  const instant = Temporal.Instant.from(utcIso)
  // Convert to target timezone
  return instant.toZonedDateTimeISO(timezone)
}

/**
 * Format UTC datetime as local time in configured timezone.
 *
 * @param utcIso - UTC datetime in ISO 8601 format
 * @param timezone - IANA timezone identifier
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted time string (e.g., "2:00 PM")
 *
 * @example
 * ```ts
 * const utcTime = '2026-08-26T18:00:00+00:00'
 * formatUtcTime(utcTime, 'America/New_York', { hour: 'numeric', minute: '2-digit' })
 * // Returns "2:00 PM"
 * ```
 */
export function formatUtcTime(
  utcIso: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const zoned = convertUtcToTimezone(utcIso, timezone)

  // Use Intl.DateTimeFormat for locale-aware formatting
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  })

  // Create a Date object for formatting (Temporal doesn't have direct Intl integration yet)
  const date = new Date(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  )

  return formatter.format(date)
}

/**
 * Format UTC datetime as local date in configured timezone.
 *
 * @param utcIso - UTC datetime in ISO 8601 format
 * @param timezone - IANA timezone identifier
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string (e.g., "Aug 26, 2026")
 */
export function formatUtcDate(
  utcIso: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const zoned = convertUtcToTimezone(utcIso, timezone)

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })

  const date = new Date(zoned.year, zoned.month - 1, zoned.day)
  return formatter.format(date)
}

/**
 * Convert UTC time string (HH:MM) to local timezone and format.
 *
 * Used for sunrise/sunset times which are returned as "HH:MM" in UTC.
 *
 * @param utcTime - UTC time in HH:MM format (e.g., "10:15")
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Formatted time string in local timezone (e.g., "6:15 AM")
 *
 * @example
 * ```ts
 * formatUtcTimeOfDay('10:15', 'America/New_York')
 * // Returns "6:15 AM" (EDT is UTC-4)
 * ```
 */
export function formatUtcTimeOfDay(
  utcTime: string,
  timezone: string
): string {
  // Parse HH:MM into hours and minutes
  const parts = utcTime.split(':')
  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  // Create a ZonedDateTime for today at the UTC time
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

  // Format using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const date = new Date(
    localZoned.year,
    localZoned.month - 1,
    localZoned.day,
    localZoned.hour,
    localZoned.minute,
    localZoned.second
  )

  return formatter.format(date)
}
