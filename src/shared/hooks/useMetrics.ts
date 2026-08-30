/**
 * Hook for fetching system metrics via the API.
 *
 * Uses React Query with auto-refresh to monitor data freshness,
 * network health, and cache statistics.
 */

import { useQuery } from '@tanstack/react-query'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseApiError } from '@/shared/errors'
import type { MetricsResponse } from '@/types/metrics'

/** Metrics data is considered fresh for 10 seconds. */
const METRICS_STALE_TIME_MS = 10_000

/**
 * Fetches metrics data from the API.
 *
 * @returns System metrics including data freshness and network health.
 * @throws {ApiError} When the API returns a non-ok response.
 */
async function fetchMetrics(): Promise<MetricsResponse> {
  const response = await fetch(ENDPOINTS.metrics.url)
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Fetches and manages system metrics with React Query caching.
 *
 * Auto-refreshes every 30 seconds to keep metrics current.
 *
 * @returns Metrics data, loading states, and error info.
 */
export function useMetrics() {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useQuery<MetricsResponse>({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    staleTime: METRICS_STALE_TIME_MS,
    refetchInterval: ENDPOINTS.metrics.refreshInterval,
  })

  return {
    metrics: data ?? null,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error: error instanceof Error ? error.message : null,
    lastRefresh: dataUpdatedAt > 0 ? dataUpdatedAt : null,
  }
}
