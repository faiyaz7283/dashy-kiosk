/**
 * Tests for useTheme hook.
 *
 * Validates theme mode management with localStorage persistence,
 * system preference detection, and sunrise/sunset-based auto mode.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

// Mock useConfig to return a fixed timezone
vi.mock('@/shared/date', () => ({
  useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
}))

// Mock parseWeatherTime to return fixed times
vi.mock('@/shared/date/parse', () => ({
  parseWeatherTime: (timeStr: string): Temporal.PlainTime => {
    const parts = timeStr.split(':')
    const h = Number(parts[0] ?? '0')
    const m = Number(parts[1] ?? '0')
    return Temporal.PlainTime.from({ hour: h, minute: m })
  },
}))

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.unstubAllGlobals()
  })

  it('defaults to auto mode', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('auto')
  })

  it('resolves theme based on system preference in auto mode without sun times', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    const { result } = renderHook(() => useTheme())
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('loads saved mode from localStorage', () => {
    localStorage.setItem('dashy-theme-mode', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('persists mode changes to localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setMode('light')
    })

    expect(result.current.mode).toBe('light')
    expect(localStorage.getItem('dashy-theme-mode')).toBe('light')
  })

  it('applies dark class to document in dark mode', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setMode('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class from document in light mode', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setMode('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('cycles through modes: auto → light → dark → auto', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.mode).toBe('auto')

    act(() => {
      result.current.cycleMode()
    })
    expect(result.current.mode).toBe('light')

    act(() => {
      result.current.cycleMode()
    })
    expect(result.current.mode).toBe('dark')

    act(() => {
      result.current.cycleMode()
    })
    expect(result.current.mode).toBe('auto')
  })

  it('setMode overrides localStorage value', () => {
    localStorage.setItem('dashy-theme-mode', 'dark')
    const { result } = renderHook(() => useTheme())

    expect(result.current.mode).toBe('dark')

    act(() => {
      result.current.setMode('light')
    })

    expect(result.current.mode).toBe('light')
    expect(localStorage.getItem('dashy-theme-mode')).toBe('light')
  })

  it('uses sunrise/sunset for time-based preference in auto mode', () => {
    // Mock current time as 10:00 AM (daytime)
    vi.stubGlobal('Temporal', {
      ...Temporal,
      Now: {
        ...Temporal.Now,
        plainTimeISO: () => Temporal.PlainTime.from({ hour: 10, minute: 0 }),
      },
    })

    // Sunrise at 06:00 UTC, sunset at 20:00 UTC
    const { result } = renderHook(() => useTheme('06:00', '20:00'))
    expect(result.current.mode).toBe('auto')
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('resolves to dark after sunset in auto mode', () => {
    // Mock current time as 22:00 (after sunset)
    vi.stubGlobal('Temporal', {
      ...Temporal,
      Now: {
        ...Temporal.Now,
        plainTimeISO: () => Temporal.PlainTime.from({ hour: 22, minute: 0 }),
      },
    })

    const { result } = renderHook(() => useTheme('06:00', '20:00'))
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('resolves to dark before sunrise in auto mode', () => {
    // Mock current time as 04:00 (before sunrise)
    vi.stubGlobal('Temporal', {
      ...Temporal,
      Now: {
        ...Temporal.Now,
        plainTimeISO: () => Temporal.PlainTime.from({ hour: 4, minute: 0 }),
      },
    })

    const { result } = renderHook(() => useTheme('06:00', '20:00'))
    expect(result.current.resolvedTheme).toBe('dark')
  })
})
