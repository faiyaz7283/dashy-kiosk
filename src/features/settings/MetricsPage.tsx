/**
 * MetricsPage — full-page view displaying system metrics and diagnostics.
 *
 * Shows data freshness, network health, and cache statistics in a
 * dashboard-style layout with color-coded status indicators.
 *
 * All timestamps are converted from UTC to the configured timezone.
 */

import { Fragment, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, RefreshCw } from 'lucide-react'
import { useMetrics } from '@/shared/hooks/useMetrics'
import { useFamilyData } from '@/shared/hooks/useFamilyData'
import { useConfig, formatUtcDate } from '@/shared/date'
import type { DataStatus, MemberStatus } from '@/types/metrics'

/** Props for the MetricsPage component. */
export interface MetricsPageProps {
  /** Whether the page is open. */
  open: boolean
  /** Callback when the page should close. */
  onClose: () => void
}

/**
 * Status badge color mapping.
 */
const statusColors: Record<DataStatus, string> = {
  fresh: 'bg-success/10 text-success',
  stale: 'bg-warning/10 text-warning',
  missing: 'bg-danger/10 text-danger',
}

/**
 * Member status badge color mapping.
 */
const memberStatusColors: Record<MemberStatus, string> = {
  success: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  missing: 'bg-text-muted/10 text-text-muted',
  unknown: 'bg-text-muted/10 text-text-muted',
}

/**
 * Format age in seconds to human-readable string.
 *
 * @param seconds - Age in seconds.
 * @returns Formatted string (e.g., "2 minutes", "1 hour").
 */
function formatAge(seconds: number | null): string {
  if (seconds === null) return 'Never'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  return `${Math.round(seconds / 86400)} days`
}

/**
 * Format TTL in seconds to human-readable string.
 *
 * @param seconds - TTL in seconds.
 * @returns Formatted string (e.g., "10 minutes", "1 day").
 */
function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  return `${Math.round(seconds / 86400)} days`
}

/**
 * Metrics dashboard page.
 *
 * @param props - Page configuration and callbacks.
 * @returns The metrics page UI.
 */
export function MetricsPage({ open, onClose }: MetricsPageProps) {
  const { metrics, isLoading, isRefreshing, error } = useMetrics()
  const { members } = useFamilyData()
  const { timezone } = useConfig()

  // Create a mapping from member key to name for display
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach((member) => {
      map.set(member.key, member.name)
    })
    return map
  }, [members])

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Page */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="my-8 w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-popup ring-1 ring-border dark:bg-bg">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-light bg-white px-6 py-4 dark:bg-bg">
                  <div className="flex items-center gap-3">
                    <Dialog.Title className="text-lg font-semibold text-text-primary">
                      System Metrics
                    </Dialog.Title>
                    {isRefreshing && (
                      <RefreshCw className="h-4 w-4 animate-spin text-text-muted" />
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                    aria-label="Close metrics"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  {isLoading && (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-text-muted" />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                      Failed to load metrics: {error}
                    </div>
                  )}

                  {metrics && (
                    <div className="space-y-6">
                      {/* Weather Data */}
                      <section>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                          Weather Data
                        </h3>
                        <div className="rounded-lg border border-border-light bg-bg-hover/30 p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <div className="text-xs text-text-muted">Status</div>
                              <div className="mt-1">
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[metrics.weather.status]}`}
                                >
                                  {metrics.weather.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">Age</div>
                              <div className="mt-1 text-sm font-medium text-text-primary">
                                {formatAge(metrics.weather.age_seconds)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">Last Fetch</div>
                              <div className="mt-1 text-sm text-text-primary">
                                {metrics.weather.last_fetch
                                  ? formatUtcDate(metrics.weather.last_fetch, timezone, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })
                                  : 'Never'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">TTL</div>
                              <div className="mt-1 text-sm text-text-primary">
                                Fresh: {formatTTL(metrics.weather.fresh_ttl)}
                                <br />
                                Stale: {formatTTL(metrics.weather.stale_ttl)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Calendar Data */}
                      <section>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                          Calendar Data
                        </h3>
                        <div className="rounded-lg border border-border-light bg-bg-hover/30 p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <div className="text-xs text-text-muted">Status</div>
                              <div className="mt-1">
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[metrics.calendar.status]}`}
                                >
                                  {metrics.calendar.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">Age</div>
                              <div className="mt-1 text-sm font-medium text-text-primary">
                                {formatAge(metrics.calendar.age_seconds)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">Last Fetch</div>
                              <div className="mt-1 text-sm text-text-primary">
                                {metrics.calendar.last_fetch
                                  ? formatUtcDate(metrics.calendar.last_fetch, timezone, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })
                                  : 'Never'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">TTL</div>
                              <div className="mt-1 text-sm text-text-primary">
                                Fresh: {formatTTL(metrics.calendar.fresh_ttl)}
                                <br />
                                Stale: {formatTTL(metrics.calendar.stale_ttl)}
                              </div>
                            </div>
                          </div>

                          {/* Per-Member Breakdown */}
                          {Object.keys(metrics.calendar.members).length > 0 && (
                            <div className="mt-4 border-t border-border-light pt-4">
                              <div className="mb-2 text-xs font-medium text-text-muted">
                                Per-Member Status
                              </div>
                              <div className="space-y-2">
                                {Object.entries(metrics.calendar.members).map(
                                  ([memberId, memberData]) => (
                                    <div
                                      key={memberId}
                                      className="flex items-center justify-between rounded-md bg-bg-hover/50 px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${memberStatusColors[memberData.status]}`}
                                        >
                                          {memberData.status}
                                        </span>
                                        <span className="text-sm text-text-primary">
                                          {memberNameMap.get(memberId) ?? memberId}
                                        </span>
                                      </div>
                                      <div className="text-xs text-text-muted">
                                        {memberData.event_count} events
                                        {memberData.error && (
                                          <span className="ml-2 text-danger">
                                            ({memberData.error})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Network Health */}
                      <section>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                          Network Health
                        </h3>
                        <div className="rounded-lg border border-border-light bg-bg-hover/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${metrics.network.google_calendar.reachable ? 'bg-success' : 'bg-danger'}`}
                                />
                                <span className="text-sm text-text-primary">
                                  Google Calendar
                                </span>
                              </div>
                              <div className="text-xs text-text-muted">
                                {metrics.network.google_calendar.last_check &&
                                  formatUtcDate(
                                    metrics.network.google_calendar.last_check,
                                    timezone,
                                    {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    },
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${metrics.network.openweathermap.reachable ? 'bg-success' : 'bg-danger'}`}
                                />
                                <span className="text-sm text-text-primary">
                                  OpenWeatherMap
                                </span>
                              </div>
                              <div className="text-xs text-text-muted">
                                {metrics.network.openweathermap.last_check &&
                                  formatUtcDate(
                                    metrics.network.openweathermap.last_check,
                                    timezone,
                                    {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    },
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Cache Statistics */}
                      <section>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                          Cache Statistics
                        </h3>
                        <div className="rounded-lg border border-border-light bg-bg-hover/30 p-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-text-muted">Hits</div>
                              <div className="mt-1 text-2xl font-semibold text-success">
                                {metrics.cache.hits}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">Misses</div>
                              <div className="mt-1 text-2xl font-semibold text-warning">
                                {metrics.cache.misses}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-muted">Errors</div>
                              <div className="mt-1 text-2xl font-semibold text-danger">
                                {metrics.cache.errors}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 border-t border-border-light bg-white px-6 py-4 dark:bg-bg">
                  <button
                    onClick={onClose}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
