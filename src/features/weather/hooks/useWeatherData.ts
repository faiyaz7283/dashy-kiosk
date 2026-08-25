/**
 * Hook for fetching weather data via the API.
 *
 * Uses React Query with stale-while-revalidate for instant UI updates.
 * Returns current conditions and daily forecast from the weather endpoint.
 */

import { useQuery } from '@tanstack/react-query'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseApiError } from '@/shared/errors'
import type { WeatherResponse } from '@/types/weather'

/** Weather data is considered fresh for 5 minutes. */
const WEATHER_STALE_TIME_MS = 300_000

/** Weather data is refetched every 10 minutes in the background. */
const WEATHER_REFETCH_INTERVAL_MS = 600_000

/**
 * Fetches weather data from the API.
 *
 * @returns Parsed weather response.
 * @throws {ApiError} When the API returns a non-ok response.
 */
async function fetchWeather(): Promise<WeatherResponse> {
  const response = await fetch(ENDPOINTS.weather.url)
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Fetches and manages weather data with React Query caching.
 *
 * @returns Current weather, forecast, loading states, and error info.
 */
export function useWeatherData() {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useQuery<WeatherResponse>({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: WEATHER_STALE_TIME_MS,
    refetchInterval: WEATHER_REFETCH_INTERVAL_MS,
  })

  return {
    current: data?.current ?? null,
    forecast: data?.forecast ?? [],
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error: error instanceof Error ? error.message : null,
    lastRefresh: dataUpdatedAt > 0 ? dataUpdatedAt : null,
  }
}
