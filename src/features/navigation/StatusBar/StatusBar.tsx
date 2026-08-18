/**
 * StatusBar component showing countdown timers for calendar and weather refreshes.
 *
 * Visibility is driven by the parent (mouse proximity to the bottom edge,
 * macOS-Dock style) via the `visible` prop.
 */

import { useEffect, useState } from 'react'
import { Calendar, Settings, Sun } from 'lucide-react'
import { ThemeToggle } from '@/theme/ThemeToggle'

interface StatusBarProps {
  calendarLastRefresh: number | null
  weatherLastRefresh: number | null
  /** Whether the bar is visible (mouse near the bottom edge). */
  visible?: boolean
  /** Callback to open settings. */
  onSettingsClick?: () => void
}

const CALENDAR_INTERVAL = 120 // 2 minutes in seconds
const WEATHER_INTERVAL = 600 // 10 minutes in seconds

/**
 * StatusBar component.
 *
 * @param props - Component props.
 * @returns The status bar UI.
 */
export function StatusBar({
  calendarLastRefresh,
  weatherLastRefresh,
  visible = true,
  onSettingsClick,
}: StatusBarProps) {
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  function formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'refreshing…'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0) return `in ${m}m ${String(s).padStart(2, '0')}s`
    return `in ${s}s`
  }

  function getCountdown(lastRefresh: number | null, interval: number): number {
    if (!lastRefresh) return interval
    const elapsed = Math.floor((now - lastRefresh) / 1000)
    return Math.max(0, interval - elapsed)
  }

  const calendarCountdown = getCountdown(calendarLastRefresh, CALENDAR_INTERVAL)
  const weatherCountdown = getCountdown(weatherLastRefresh, WEATHER_INTERVAL)
  const calendarRefreshing = calendarCountdown === 0
  const weatherRefreshing = weatherCountdown === 0

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-between px-4 transition-all duration-250 overflow-hidden ${
        visible ? 'h-7 opacity-100' : 'h-0 opacity-0'
      }`}
      style={{
        background: 'var(--dt-bg)',
        borderTop: visible ? '1px solid var(--dt-border)' : '1px solid transparent',
        fontSize: '12px',
        color: 'var(--dt-text-faint)',
      }}
    >
      {/* Left: Settings icon */}
      <button
        onClick={onSettingsClick}
        className="p-1 rounded hover:bg-[var(--dt-bg-hover)] transition-colors"
        style={{ color: 'var(--dt-text-secondary)' }}
        title="Settings"
        aria-label="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Center: Countdown timers */}
      <div className="flex items-center gap-3">
        {/* Calendar indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${calendarRefreshing ? 'animate-pulse' : ''}`}
            style={{ background: calendarRefreshing ? 'var(--dt-primary)' : 'var(--dt-success)' }}
          />
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="inline-block min-w-[72px] text-left tabular-nums">
            {formatCountdown(calendarCountdown)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

        {/* Weather indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${weatherRefreshing ? 'animate-pulse' : ''}`}
            style={{ background: weatherRefreshing ? 'var(--dt-primary)' : 'var(--dt-success)' }}
          />
          <Sun className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="inline-block min-w-[72px] text-left tabular-nums">
            {formatCountdown(weatherCountdown)}
          </span>
        </div>
      </div>

      {/* Right: Theme toggle */}
      <ThemeToggle />
    </div>
  )
}
