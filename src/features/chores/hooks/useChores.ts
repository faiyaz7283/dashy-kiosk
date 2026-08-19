/**
 * useChores — data fetching hook for chores.
 *
 * Wraps the useApi hook with the getChores fetch function and
 * the chores endpoint refresh interval. Returns typed chores data
 * with loading, error, and refetch capabilities.
 */

import { useApi } from '@/shared/hooks/useApi'
import { getChores } from '@/shared/services/api'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { ChoresData } from '@/types'

/** Return type of the useChores hook. */
export interface UseChoresReturn {
  /** The chores data, or null while loading. */
  data: ChoresData | null
  /** Whether the initial fetch is in progress. */
  loading: boolean
  /** Error message, or null if no error. */
  error: string | null
  /** Manually trigger a refetch. */
  refetch: () => void
  /** Timestamp of the last successful refresh. */
  lastRefresh: number | null
}

/**
 * Fetches and manages chores data from the API.
 *
 * Uses the useApi hook with automatic refresh based on the
 * chores endpoint configuration.
 *
 * @returns Chores data state and controls.
 */
export function useChores(): UseChoresReturn {
  const { data, loading, error, refetch, lastRefresh } = useApi<ChoresData>(getChores, {
    refetchInterval: ENDPOINTS.chores.refreshInterval,
  })

  return { data, loading, error, refetch, lastRefresh }
}
