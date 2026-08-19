/**
 * API service layer — fetch functions for all backend endpoints.
 *
 * Uses the endpoint registry for URLs and cache TTLs. All fetch functions
 * use fetchWithRetry for resilience and return typed responses.
 */

import type {
  CalendarEvent,
  FamilyMember,
  WeekCalendar,
  WeatherResponse,
  ChoresData,
  InstanceStatus,
} from '@/types'
import type { RawWeekCalendar } from '@/shared/date/parse'
import { parseWeekCalendar } from '@/shared/date/parse'
import { ENDPOINTS } from '@/shared/api/endpoints'

const API_BASE = import.meta.env.VITE_API_URL

if (!API_BASE) {
  throw new Error('VITE_API_URL environment variable is required')
}

interface CacheEntry {
  events: CalendarEvent[]
  fetchedAt: number
}

/** In-memory cache for calendar events, keyed by date range. */
const calendarCache = new Map<string, CacheEntry>()

/**
 * Fetch with exponential backoff retry.
 *
 * @param url - Full URL to fetch.
 * @param maxRetries - Maximum number of retry attempts (default: 5).
 * @param delayMs - Initial delay in milliseconds (default: 2000).
 * @returns Parsed JSON response.
 */
async function fetchWithRetry<T>(url: string, maxRetries = 5, delayMs = 2000): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 2s, 4s, 8s, 16s
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries')
}

/**
 * Check backend health.
 *
 * @returns True if backend is healthy, false otherwise.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}${ENDPOINTS.health.url}`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Wait for backend to become available.
 *
 * Polls the health endpoint until it responds successfully. Calls onProgress
 * with elapsed time for UI feedback.
 *
 * @param onProgress - Optional callback with elapsed milliseconds.
 */
export async function waitForBackend(onProgress?: (elapsedMs: number) => void): Promise<void> {
  const startTime = Date.now()

  while (true) {
    if (await checkHealth()) {
      return
    }
    onProgress?.(Date.now() - startTime)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

/**
 * Fetch calendar events for a date range.
 *
 * Uses an in-memory cache to avoid redundant API calls within the TTL window.
 * Rapid view switching (e.g. Day → Week → Day) will hit the cache on the
 * second visit to the same range.
 *
 * @param startDate - ISO format start date (e.g. "2026-08-08").
 * @param endDate - ISO format end date (e.g. "2026-08-08").
 * @param options - Optional fetch options. Set `bypassCache` to true to skip the cache.
 * @returns Object containing the calendar data and a boolean indicating if it was served from cache.
 */
export async function getCalendar(
  startDate: string,
  endDate: string,
  options: { bypassCache?: boolean } = {},
): Promise<{ data: WeekCalendar; cached: boolean }> {
  const cacheKey = `${startDate}_${endDate}`
  const cached = calendarCache.get(cacheKey)
  const cacheTtl = ENDPOINTS.calendar.cacheTtl

  if (!options.bypassCache && cached && cacheTtl > 0 && Date.now() - cached.fetchedAt < cacheTtl) {
    return {
      data: {
        week_start: Temporal.PlainDate.from(startDate),
        week_end: Temporal.PlainDate.from(endDate),
        events: cached.events,
      },
      cached: true,
    }
  }

  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  const rawData = await fetchWithRetry<RawWeekCalendar>(
    `${API_BASE}${ENDPOINTS.calendar.url}?${params}`,
  )

  // Parse raw API response into typed WeekCalendar with Temporal dates
  const data = parseWeekCalendar(rawData)

  calendarCache.set(cacheKey, {
    events: data.events,
    fetchedAt: Date.now(),
  })

  return { data, cached: false }
}

/**
 * Clear the calendar cache. Useful for forcing a fresh fetch.
 */
export function clearCalendarCache(): void {
  calendarCache.clear()
}

/**
 * Fetch current weather and forecast.
 *
 * @returns Weather response with current conditions and forecast.
 */
export async function getWeather(): Promise<WeatherResponse> {
  return fetchWithRetry<WeatherResponse>(`${API_BASE}${ENDPOINTS.weather.url}`)
}

/**
 * Fetch family members.
 *
 * @returns Array of family members with calendar and display config.
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  return fetchWithRetry<FamilyMember[]>(`${API_BASE}${ENDPOINTS.family.url}`)
}

/**
 * POST helper with exponential backoff retry.
 *
 * @param url - Full URL to send the request to.
 * @param body - JSON-serializable request body.
 * @param maxRetries - Maximum number of retry attempts (default: 3).
 * @param delayMs - Initial delay in milliseconds (default: 2000).
 * @returns Parsed JSON response.
 */
async function postWithRetry<T>(
  url: string,
  body: unknown,
  maxRetries = 3,
  delayMs = 2000,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('Failed to post after retries')
}

// ---------------------------------------------------------------------------
// Chores API
// ---------------------------------------------------------------------------

/**
 * Fetch all chores data (categories, tags, masters, instances).
 *
 * @returns Complete chores data payload.
 */
export async function getChores(): Promise<ChoresData> {
  return fetchWithRetry<ChoresData>(`${API_BASE}${ENDPOINTS.chores.url}`)
}

/**
 * Create a new master chore template.
 *
 * @param data - Master chore fields.
 * @returns The created master chore.
 */
export async function createMasterChore(
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/masters`, data)
}

/**
 * Claim an open-pool chore instance for a member.
 *
 * @param instanceId - The instance to claim.
 * @param memberId - The member claiming it.
 */
export async function claimInstance(
  instanceId: string,
  memberId: string,
): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/instances/${instanceId}/claim`, {
    member_id: memberId,
  })
}

/**
 * Assign a chore instance to a member.
 *
 * @param instanceId - The instance to assign.
 * @param assigneeId - The member being assigned.
 * @param assignerId - The parent making the assignment.
 */
export async function assignInstance(
  instanceId: string,
  assigneeId: string,
  assignerId: string,
): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/instances/${instanceId}/assign`, {
    assignee_id: assigneeId,
    assigner_id: assignerId,
  })
}

/**
 * Update the status of a chore instance.
 *
 * @param instanceId - The instance to update.
 * @param status - The new status.
 * @param actorId - The member performing the action.
 */
export async function updateInstanceStatus(
  instanceId: string,
  status: InstanceStatus,
  actorId: string,
): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/instances/${instanceId}/status`, {
    status,
    actor_id: actorId,
  })
}

/**
 * Create a new chore category.
 *
 * @param name - Category display name.
 */
export async function createCategory(name: string): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/categories`, { name })
}

/**
 * Create a new chore tag.
 *
 * @param name - Tag display name.
 */
export async function createTag(name: string): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/tags`, { name })
}

/**
 * Approve a pending master chore.
 *
 * @param choreId - The master chore to approve.
 * @param approverId - The parent approving it.
 */
export async function approveMasterChore(
  choreId: string,
  approverId: string,
): Promise<Record<string, unknown>> {
  return postWithRetry(`${API_BASE}${ENDPOINTS.chores.url}/masters/${choreId}/approve`, {
    approver_id: approverId,
  })
}
