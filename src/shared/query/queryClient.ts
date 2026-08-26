import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/errors'

/**
 * Default stale time for queries (30 seconds).
 *
 * Data is considered "fresh" for 30 seconds. During this time,
 * React Query serves cached data without triggering a refetch.
 */
const DEFAULT_STALE_TIME_MS = 30_000

/**
 * Default retry count for failed queries.
 *
 * Failed requests are retried twice before showing an error state.
 */
const DEFAULT_RETRY_COUNT = 2

/**
 * Maximum retry delay in milliseconds (30 seconds).
 *
 * Exponential backoff caps at this value to avoid excessive delays.
 */
const MAX_RETRY_DELAY_MS = 30_000

/**
 * Determine whether a failed query should be retried.
 *
 * Non-retryable errors (400, 401, 403, 404, 422) are not retried
 * because they represent client errors that won't resolve on retry.
 * Server errors (5xx), rate limits (429), and network failures (0)
 * are retried up to the default retry count.
 *
 * @param failureCount - Number of retries already attempted.
 * @param error - The error that caused the failure.
 * @returns Whether to retry the query.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && !error.isRetryable) return false
  return failureCount < DEFAULT_RETRY_COUNT
}

/**
 * Calculate retry delay with exponential backoff.
 *
 * @param attempt - Zero-based attempt number (0 = first retry).
 * @param _error - The error that caused the retry (unused but required by API).
 * @returns Delay in milliseconds before next retry.
 */
function calculateRetryDelay(attempt: number, _error: unknown): number {
  return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS)
}

/**
 * Global React Query client instance.
 *
 * Configured with sensible defaults for the Dashy kiosk:
 * - 30s stale time: serves cached data instantly for 30s
 * - Refetch on window focus: updates data when user returns to tab
 * - Smart retry: skips non-retryable errors (400s), retries transient failures (5xx, network)
 * - Exponential backoff: 1s, 2s, 4s... capped at 30s
 *
 * Individual queries can override these defaults via `useQuery` options.
 *
 * @example
 * ```tsx
 * // Use with defaults
 * const { data } = useQuery({
 *   queryKey: ['weather'],
 *   queryFn: fetchWeather,
 * })
 *
 * // Override stale time for specific query
 * const { data } = useQuery({
 *   queryKey: ['calendar'],
 *   queryFn: fetchCalendar,
 *   staleTime: 60_000, // 1 minute
 * })
 * ```
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      refetchOnWindowFocus: true,
      retry: shouldRetry,
      retryDelay: calculateRetryDelay,
    },
  },
})
