/**
 * Metrics types for data freshness and system health monitoring.
 *
 * These types represent the response from the /api/v1/metrics endpoint.
 */

/** Data freshness status. */
export type DataStatus = 'fresh' | 'stale' | 'missing'

/** Member calendar fetch status. */
export type MemberStatus = 'success' | 'failed' | 'missing' | 'unknown'

/**
 * Data source freshness information.
 */
export interface DataSourceMetrics {
  /** Current status of the data. */
  status: DataStatus
  /** Age of the data in seconds (null if missing). */
  age_seconds: number | null
  /** Fresh cache TTL in seconds. */
  fresh_ttl: number
  /** Stale cache TTL in seconds. */
  stale_ttl: number
  /** ISO timestamp of last successful fetch (null if never fetched). */
  last_fetch: string | null
}

/**
 * Per-member calendar fetch metrics.
 */
export interface MemberMetrics {
  /** Fetch status for this member's calendar. */
  status: MemberStatus
  /** ISO timestamp of last fetch attempt. */
  last_fetch: string | null
  /** Number of events fetched. */
  event_count: number
  /** Error message if fetch failed. */
  error: string | null
}

/**
 * Calendar metrics with per-member breakdown.
 */
export interface CalendarMetrics extends DataSourceMetrics {
  /** Per-member fetch status. */
  members: Record<string, MemberMetrics>
}

/**
 * Network health information for an upstream service.
 */
export interface NetworkHealth {
  /** Whether the service is reachable. */
  reachable: boolean
  /** HTTP status code from health check. */
  status_code?: number
  /** ISO timestamp of last health check. */
  last_check: string
  /** Error message if unreachable. */
  error?: string
}

/**
 * Network health for all upstream services.
 */
export interface NetworkMetrics {
  /** Google Calendar API health. */
  google_calendar: NetworkHealth
  /** OpenWeatherMap API health. */
  openweathermap: NetworkHealth
}

/**
 * Cache statistics.
 */
export interface CacheMetrics {
  /** Number of cache hits. */
  hits: number
  /** Number of cache misses. */
  misses: number
  /** Number of cache errors. */
  errors: number
}

/**
 * Complete metrics response from /api/v1/metrics.
 */
export interface MetricsResponse {
  /** Weather data freshness. */
  weather: DataSourceMetrics
  /** Calendar data freshness with per-member breakdown. */
  calendar: CalendarMetrics
  /** Network health for upstream services. */
  network: NetworkMetrics
  /** Cache statistics. */
  cache: CacheMetrics
}
