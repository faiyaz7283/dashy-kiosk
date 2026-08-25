/**
 * Tests for useWeatherData hook.
 *
 * Validates React Query integration, data transformation, and loading states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { useWeatherData } from './useWeatherData'
import type { WeatherResponse } from '@/types/weather'
import { createTestQueryClient, createQueryClientWrapper } from '@/test/test-utils'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = createTestQueryClient()
})

afterEach(() => {
  queryClient.clear()
})

const mockWeatherResponse: WeatherResponse = {
  current: {
    temperature: 72,
    feels_like: 75,
    condition: 'clear',
    icon: 'd',
    is_night: false,
    humidity: 45,
    wind_speed: 10,
  },
  forecast: [
    {
      date: '2026-08-25',
      high: 78,
      low: 65,
      condition: 'clear',
      icon: 'clear',
    },
  ],
}

describe('useWeatherData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in loading state', () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(
      () => new Promise(() => {}), // Never resolves
    )

    const { result } = renderHook(() => useWeatherData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.current).toBeNull()
    expect(result.current.forecast).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns weather data after successful fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWeatherResponse),
    } as Response)

    const { result } = renderHook(() => useWeatherData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.current).toEqual(mockWeatherResponse.current)
    expect(result.current.forecast).toEqual(mockWeatherResponse.forecast)
    expect(result.current.error).toBeNull()
  })

  it('returns error message on fetch failure', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ detail: 'Weather service unavailable' }),
    } as Response)

    const { result } = renderHook(() => useWeatherData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.current).toBeNull()
    expect(result.current.error).toBe('Weather service unavailable')
  })

  it('sets lastRefresh timestamp after successful fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWeatherResponse),
    } as Response)

    const { result } = renderHook(() => useWeatherData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.lastRefresh).toBeTypeOf('number')
    expect(result.current.lastRefresh).toBeGreaterThan(0)
  })

  it('provides isRefreshing state during background refetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWeatherResponse),
    } as Response)

    const { result } = renderHook(() => useWeatherData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // After initial load, isRefreshing should be false
    expect(result.current.isRefreshing).toBe(false)
  })
})
