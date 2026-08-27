/**
 * HeaderLeft — shared left section of the application header.
 *
 * Displays:
 * - Current date (2 rows: formatted date + week/day-of-year)
 * - Clock (live-updating time)
 * - Weather summary with hover popup
 *
 * Used by both the calendar header and the chores header.
 */

import { Clock, Droplets, Wind, AlertCircle } from 'lucide-react'
import { useWeatherData } from '@/features/weather/hooks/useWeatherData'
import { useWeatherPopup } from '@/features/weather/hooks/useWeatherPopup'
import { useClock } from '@/shared/hooks/useClock'
import { formatHeaderDate, formatTime } from '@/shared/date'
import { getWeekKey, formatRelativeDay } from '@/shared/date/calendar'
import { WeatherPopup } from '@/features/weather/components/WeatherPopup'
import { WeatherIcon } from '@/features/weather/components/WeatherIcon'
import type { WeatherCondition } from '@/types/weather'

/**
 * Shared header left section with date, clock, and weather.
 *
 * @returns The left section of the header.
 */
export function HeaderLeft() {
  const { current: weather, forecast, error: weatherError } = useWeatherData()
  const { popupRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = useWeatherPopup()
  const clockTime = useClock()

  const today = Temporal.Now.plainDateISO()

  const weekKey = getWeekKey(today)
  const weekParts = weekKey.split('-W')
  const weekNumber = weekParts[1] ?? '1'
  const dayOfYear = today.dayOfYear

  const { dayLabel, dateLabel } = formatRelativeDay(today)

  return (
    <div className="flex items-center gap-4">
      {/* Date (2 rows) */}
      <div className="flex flex-col leading-tight">
        <span className="text-base font-semibold text-text-primary">
          {formatHeaderDate(today)}
        </span>
        <span className="text-xs text-text-muted">
          Week {weekNumber} · Day {dayOfYear}
        </span>
      </div>

      {/* Clock */}
      <div className="flex items-center gap-1.5 text-text-secondary">
        <Clock className="h-4 w-4" />
        <span className="font-mono text-sm font-medium">{formatTime(clockTime)}</span>
      </div>

      {/* Weather summary */}
      {weather && forecast[0] ? (
        <>
          <div
            className="relative flex cursor-pointer items-center gap-2"
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <WeatherIcon
              condition={weather.condition as WeatherCondition}
              size="sm"
              className="text-warning"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-text-primary">
                {Math.round(weather.temperature)}°
              </span>
              <span className="text-xs text-text-muted">
                {Math.round(weather.feels_like)}°
              </span>
            </div>
            <span className="hidden text-xs text-text-muted sm:inline">
              {weather.condition}
            </span>
            <div className="flex items-center gap-2 text-xs text-text-faint">
              <span className="flex items-center gap-0.5">
                <Droplets className="h-3 w-3" />
                {weather.humidity}%
              </span>
              <span className="flex items-center gap-0.5">
                <Wind className="h-3 w-3" />
                {Math.round(weather.wind_speed)} mph
              </span>
            </div>
          </div>

          {/* Weather popup with fixed positioning */}
          <div
            ref={popupRef}
            className="fixed z-50 opacity-0 transition-opacity duration-100"
            style={{ left: -9999, top: -9999 }}
          >
            <WeatherPopup
              forecast={forecast[0]}
              dateLabel={dayLabel}
              dateSublabel={dateLabel}
            />
          </div>
        </>
      ) : weatherError ? (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <AlertCircle className="h-3.5 w-3.5 text-error" />
          <span>Weather unavailable</span>
        </div>
      ) : null}
    </div>
  )
}
