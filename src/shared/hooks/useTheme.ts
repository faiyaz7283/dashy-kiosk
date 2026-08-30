/**
 * Theme management hook — light/dark/auto toggle with localStorage persistence.
 *
 * In `auto` mode, uses sunrise/sunset times when available for time-based switching.
 * Falls back to the system's `prefers-color-scheme` media query when sun times are unavailable.
 * The resolved theme (`light` or `dark`) is applied by toggling the `.dark`
 * class on `<html>`, which Tailwind's `@custom-variant dark` picks up.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useConfig } from '@/shared/date'
import { parseWeatherTime } from '@/shared/date/parse'

/** Theme mode preference. */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** The actually applied theme (never `auto`). */
export type ResolvedTheme = 'light' | 'dark'

/** Default sunrise time (6:00 AM) when weather data is not available. */
const DEFAULT_SUNRISE = '06:00'

/** Default sunset time (8:00 PM) when weather data is not available. */
const DEFAULT_SUNSET = '20:00'

const THEME_STORAGE_KEY = 'dashy-theme-mode'

/** Interval for checking theme changes in auto mode (1 minute). */
const AUTO_CHECK_INTERVAL_MS = 60_000

/**
 * Returns the system's preferred color scheme.
 *
 * @returns 'dark' if the user prefers dark mode, 'light' otherwise.
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Converts hours and minutes to total minutes since midnight.
 *
 * @param hours - Hours (0-23).
 * @param minutes - Minutes (0-59).
 * @returns Total minutes since midnight.
 */
function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

/**
 * Returns time-based theme preference using sunrise/sunset times.
 * Dark mode: after sunset or before sunrise.
 * Light mode: between sunrise and sunset.
 *
 * @param sunrise - Sunrise time in HH:MM UTC format, or null for default.
 * @param sunset - Sunset time in HH:MM UTC format, or null for default.
 * @param timezone - IANA timezone identifier for converting UTC to local time.
 * @param now - Current time for comparison.
 * @returns The time-based theme preference.
 */
function getTimeBasedPreference(
  sunrise: string | null,
  sunset: string | null,
  timezone: string,
  now: Temporal.PlainTime,
): ResolvedTheme {
  const currentMinutes = timeToMinutes(now.hour, now.minute)

  // Parse sunrise — convert from UTC to local timezone
  const sunriseStr = sunrise ?? DEFAULT_SUNRISE
  const sunriseTime = parseWeatherTime(sunriseStr, timezone)
  const sunriseMinutes = timeToMinutes(sunriseTime.hour, sunriseTime.minute)

  // Parse sunset — convert from UTC to local timezone
  const sunsetStr = sunset ?? DEFAULT_SUNSET
  const sunsetTime = parseWeatherTime(sunsetStr, timezone)
  const sunsetMinutes = timeToMinutes(sunsetTime.hour, sunsetTime.minute)

  return currentMinutes < sunriseMinutes || currentMinutes >= sunsetMinutes ? 'dark' : 'light'
}

/**
 * Applies the resolved theme to the DOM.
 *
 * Toggles the `.dark` class on `<html>` which Tailwind's dark variant uses.
 *
 * @param theme - The resolved theme to apply.
 */
function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/** Return type of the useTheme hook. */
export interface UseThemeResult {
  /** The user's theme preference (light/dark/auto). */
  mode: ThemeMode
  /** The actually applied theme (light or dark). */
  resolvedTheme: ResolvedTheme
  /** Set the theme mode. Persists to localStorage. */
  setMode: (mode: ThemeMode) => void
  /** Cycle to the next theme mode: light → dark → auto → light. */
  cycleMode: () => void
}

/**
 * Manages the application theme.
 *
 * Persists the user's preference to localStorage. In `auto` mode:
 * - Uses sunrise/sunset times for time-based switching when available
 * - Falls back to system `prefers-color-scheme` when sun times are unavailable
 *
 * @param sunrise - Optional sunrise time in HH:MM UTC format (from weather data).
 * @param sunset - Optional sunset time in HH:MM UTC format (from weather data).
 * @returns Theme state and controls.
 *
 * @example
 * ```ts
 * const { mode, resolvedTheme, setMode, cycleMode } = useTheme(sunrise, sunset)
 * // mode === 'auto', resolvedTheme === 'dark' (after sunset)
 * ```
 */
export function useTheme(sunrise: string | null = null, sunset: string | null = null): UseThemeResult {
  const { timezone } = useConfig()

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
    return 'auto'
  })

  // Current time for time-based auto mode (updated every minute)
  const [now, setNow] = useState(() => Temporal.Now.plainTimeISO())

  // System preference for auto mode without sun times
  const [systemPref, setSystemPref] = useState(() => getSystemPreference())

  // Derive resolved theme during render — no setState in effects
  const resolvedTheme = useMemo(() => {
    if (mode === 'auto') {
      if (sunrise !== null || sunset !== null) {
        return getTimeBasedPreference(sunrise, sunset, timezone, now)
      }
      return systemPref
    }
    return mode
  }, [mode, sunrise, sunset, timezone, now, systemPref])

  // Apply theme to DOM whenever resolved theme changes
  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Update current time every minute (for time-based auto mode)
  useEffect(() => {
    if (mode !== 'auto') return
    if (sunrise === null && sunset === null) return

    const interval = setInterval(() => setNow(Temporal.Now.plainTimeISO()), AUTO_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [mode, sunrise, sunset])

  // Listen for system preference changes (for auto mode without sun times)
  useEffect(() => {
    if (mode !== 'auto') return
    if (sunrise !== null || sunset !== null) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemPref(getSystemPreference())
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode, sunrise, sunset])

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(THEME_STORAGE_KEY, newMode)
  }, [])

  const cycleMode = useCallback(() => {
    const next: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light',
    }
    setModeState((prev) => next[prev])
  }, [])

  return { mode, resolvedTheme, setMode, cycleMode }
}
