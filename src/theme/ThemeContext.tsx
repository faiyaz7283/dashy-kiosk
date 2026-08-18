/**
 * Theme context and provider for dark/light/auto mode.
 *
 * Manages theme state, persists user preference to localStorage,
 * and applies the theme via data-theme attribute on the document root.
 * Auto mode uses sunrise/sunset times from weather data when available.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

/** Theme mode options. */
export type ThemeMode = 'auto' | 'light' | 'dark'

/** Resolved theme (always light or dark, never auto). */
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** Current theme mode (auto, light, or dark). */
  mode: ThemeMode
  /** Resolved theme (light or dark, after applying sunrise/sunset if auto). */
  resolvedTheme: ResolvedTheme
  /** Set the theme mode. */
  setMode: (mode: ThemeMode) => void
  /** Update sunrise/sunset times for auto mode (from weather data). */
  setSunTimes: (sunrise: string | null, sunset: string | null) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'dashy-theme-mode'

/** Default sunrise time (6:00 AM) when weather data is not available. */
const DEFAULT_SUNRISE = '06:00'

/** Default sunset time (8:00 PM) when weather data is not available. */
const DEFAULT_SUNSET = '20:00'

/**
 * Get the system's preferred color scheme.
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  if (typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Parse time string (HH:MM or ISO format) to hours and minutes.
 */
function parseTime(timeStr: string | undefined | null): { hours: number; minutes: number } | null {
  if (typeof timeStr !== 'string' || timeStr.length === 0) return null

  // Try ISO format first (e.g., "2026-08-18T06:13:00-04:00")
  if (timeStr.includes('T')) {
    const date = new Date(timeStr)
    if (!isNaN(date.getTime())) {
      return { hours: date.getHours(), minutes: date.getMinutes() }
    }
  }

  // Try HH:MM format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (match && match[1] && match[2]) {
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes }
    }
  }

  return null
}

/**
 * Convert time to minutes since midnight for easy comparison.
 */
function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

/**
 * Get time-based theme preference using sunrise/sunset times.
 * Dark mode: after sunset or before sunrise
 * Light mode: between sunrise and sunset
 */
function getTimeBasedPreference(sunrise: string | null, sunset: string | null): ResolvedTheme {
  if (typeof Date === 'undefined') return 'light'

  const now = new Date()
  const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes())

  // Parse sunrise time (use default if not available)
  const sunriseStr: string = sunrise ?? DEFAULT_SUNRISE
  const sunriseTime = parseTime(sunriseStr)
  const sunriseMinutes = sunriseTime
    ? timeToMinutes(sunriseTime.hours, sunriseTime.minutes)
    : timeToMinutes(6, 0) // Default 6:00 AM

  // Parse sunset time (use default if not available)
  const sunsetStr: string = sunset ?? DEFAULT_SUNSET
  const sunsetTime = parseTime(sunsetStr)
  const sunsetMinutes = sunsetTime
    ? timeToMinutes(sunsetTime.hours, sunsetTime.minutes)
    : timeToMinutes(20, 0) // Default 8:00 PM

  // Dark mode: before sunrise or after sunset
  return currentMinutes < sunriseMinutes || currentMinutes >= sunsetMinutes ? 'dark' : 'light'
}

/**
 * Resolve the theme mode to a concrete theme (light or dark).
 */
function resolveTheme(
  mode: ThemeMode,
  sunrise: string | null,
  sunset: string | null,
): ResolvedTheme {
  if (mode === 'auto') return getTimeBasedPreference(sunrise, sunset)
  return mode
}

/**
 * Load the saved theme mode from localStorage.
 */
function loadSavedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  return 'auto'
}

/**
 * Save the theme mode to localStorage.
 */
function saveMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, mode)
}

/**
 * Apply the theme to the document root.
 */
function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Theme provider component.
 *
 * Manages theme state, listens for system preference changes (when in auto mode),
 * and applies the theme to the document. Uses sunrise/sunset times from weather
 * data for auto mode when available.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => loadSavedMode())
  const [sunrise, setSunrise] = useState<string | null>(null)
  const [sunset, setSunset] = useState<string | null>(null)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(mode, sunrise, sunset),
  )

  /**
   * Update the theme mode and persist to localStorage.
   */
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode)
      saveMode(newMode)
      setResolvedTheme(resolveTheme(newMode, sunrise, sunset))
    },
    [sunrise, sunset],
  )

  /**
   * Update sunrise/sunset times from weather data.
   */
  const setSunTimes = useCallback(
    (newSunrise: string | null, newSunset: string | null) => {
      setSunrise(newSunrise)
      setSunset(newSunset)
      if (mode === 'auto') {
        setResolvedTheme(resolveTheme(mode, newSunrise, newSunset))
      }
    },
    [mode],
  )

  // Apply theme to document when resolved theme changes
  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Listen for system preference changes (for auto mode)
  useEffect(() => {
    if (mode !== 'auto') return
    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setResolvedTheme(getSystemPreference())
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  // For time-based auto mode, check every minute using sunrise/sunset
  useEffect(() => {
    if (mode !== 'auto') return

    const checkTime = () => {
      setResolvedTheme(resolveTheme(mode, sunrise, sunset))
    }

    // Check immediately
    checkTime()

    // Then check every minute
    const interval = setInterval(checkTime, 60000)
    return () => clearInterval(interval)
  }, [mode, sunrise, sunset])

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, setSunTimes }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context.
 *
 * @returns Theme context value with mode, resolvedTheme, and setMode.
 * @throws Error if used outside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
