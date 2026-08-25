/**
 * Hook for fetching family member data via the API.
 *
 * Uses React Query to fetch family members once on mount.
 * Returns typed family member array.
 */

import { useQuery } from '@tanstack/react-query'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseApiError } from '@/shared/errors'
import type { FamilyMember } from '@/types'

/** Family data is considered fresh for 5 minutes. */
const FAMILY_STALE_TIME_MS = 300_000

/**
 * Fetches family member data from the API.
 *
 * @returns Array of family members.
 * @throws {ApiError} When the API returns a non-ok response.
 */
async function fetchFamily(): Promise<FamilyMember[]> {
  const response = await fetch(ENDPOINTS.family.url)
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Fetches and manages family member data with React Query caching.
 *
 * @returns Family members array, loading states, error.
 */
export function useFamilyData() {
  const { data, isLoading, error } = useQuery<FamilyMember[]>({
    queryKey: ['family'],
    queryFn: fetchFamily,
    staleTime: FAMILY_STALE_TIME_MS,
    refetchInterval: 0, // Fetch once on mount
  })

  return {
    members: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
