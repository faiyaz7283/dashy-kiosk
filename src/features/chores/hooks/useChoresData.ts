/**
 * Hook for fetching chores data via React Query.
 *
 * Provides cached chores data with automatic background refresh.
 * Returns categories, tags, master chores, and instances.
 * Calls POST /sync on initial load to ensure instances are generated.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchChores, syncChores } from '../api/choresApi'
import type { ChoresData } from '@/types/chores'

/**
 * Fetches and manages chores data with React Query caching.
 *
 * Calls sync on initial load to trigger instance generation,
 * then fetches the full data payload.
 *
 * @returns Chores data, loading states, error, and refetch trigger.
 */
export function useChoresData() {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery<ChoresData>({
    queryKey: ['chores'],
    queryFn: async () => {
      // Sync first to ensure instances are generated for current period
      await syncChores()
      // Then fetch the full data payload
      return fetchChores()
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 120_000, // 2 minutes
  })

  return {
    data: data ?? null,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    lastRefresh: dataUpdatedAt > 0 ? dataUpdatedAt : null,
  }
}
