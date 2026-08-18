/**
 * DayView component for displaying a single day's hourly timeline.
 *
 * Shows an hourly timeline with events positioned by time, an all-day events
 * section, a current time indicator (red line), and auto-scroll to current time.
 * Hovering an event shows a popup; clicking an event opens the detail modal.
 */

import { useState, useEffect, useRef } from 'react'
import { Droplet, Wind } from 'lucide-react'
import type { CalendarEvent, DailyForecast, FamilyMember } from '@/types'
import { isTimedEvent } from '@/domain/calendar/types'
import { colors, spacing, radii, typography, layout, zIndices } from '@/theme/tokens'
import { themeConfig } from '@/theme/config'
import { today, now, formatDateParts } from '@/shared/date'
import { getTimedEventsForDate, getAllDayEventsForDate } from '@/domain/calendar/utils'
import { getWeatherForDate } from '@/domain/weather/utils'
import { EventItem } from '@/features/calendar/components/EventItem'
import { EventPopup } from '@/features/calendar/components/EventPopup'
import { EventModal } from '@/features/calendar/components/EventModal'
import { WeatherIcon } from '@/features/weather/components/WeatherWidget/WeatherIcon'
import { WeatherTooltip } from '@/features/weather/components/WeatherTooltip'
import { useEventInteraction } from '@/features/calendar/hooks/useEventInteraction'
import { useWeatherTooltip } from '@/features/weather/hooks/useWeatherTooltip'

interface DayViewProps {
  /** The date to display. */
  currentDate: Temporal.PlainDate
  /** Calendar events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Weather forecast data. */
  weatherForecast?: DailyForecast[]
}

/**
 * Calculates the top position (px) for an event based on its start time.
 */
function getEventTopPx(event: CalendarEvent): number {
  if (!isTimedEvent(event)) return 0
  const hours = event.start.hour
  const minutes = event.start.minute
  const { timelineStartHour, timelineHourHeight } = {
    timelineStartHour: themeConfig.calendar.timelineStartHour,
    timelineHourHeight: layout.timelineHourHeight,
  }
  return (hours - timelineStartHour) * timelineHourHeight + (minutes / 60) * timelineHourHeight
}

/**
 * Calculates the height (px) for an event based on its duration.
 */
function getEventHeightPx(event: CalendarEvent): number {
  if (!isTimedEvent(event)) return 20
  const start = event.start
  const end = event.end
  const durationMinutes = start.until(end).total('minutes')
  const pxPerMinute = layout.timelineHourHeight / 60
  return Math.max(durationMinutes * pxPerMinute, 20) // Minimum 20px
}

/**
 * DayView component.
 *
 * @param props - Component props.
 * @returns The day view UI.
 */
export function DayView({ currentDate, events, members, weatherForecast }: DayViewProps) {
  const {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  } = useEventInteraction(events)
  const { tooltipState, showTooltip, hideTooltip } = useWeatherTooltip()
  const [currentTimeTop, setCurrentTimeTop] = useState<number>(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const isToday = currentDate.equals(today())
  const allDayEvents = getAllDayEventsForDate(events, currentDate)
  const timedEvents = getTimedEventsForDate(events, currentDate)
  const dayWeather = getWeatherForDate(weatherForecast, currentDate)

  const { timelineStartHour, timelineEndHour, timelineScrollOffset } = themeConfig.calendar
  const hours = Array.from(
    { length: timelineEndHour - timelineStartHour + 1 },
    (_, i) => timelineStartHour + i,
  )

  // Update current time indicator position
  useEffect(() => {
    if (!isToday) return

    const updateTime = () => {
      const currentTime = now()
      const hours = currentTime.hour
      const minutes = currentTime.minute
      const top =
        (hours - timelineStartHour) * layout.timelineHourHeight +
        (minutes / 60) * layout.timelineHourHeight
      setCurrentTimeTop(top)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [isToday, timelineStartHour])

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!isToday || !timelineRef.current) return

    const scrollPosition = Math.max(0, currentTimeTop - timelineScrollOffset)
    timelineRef.current.scrollTop = scrollPosition
  }, [isToday, currentTimeTop, timelineScrollOffset])

  const formatHour = (hour: number): string => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour} ${ampm}`
  }

  return (
    <div
      onMouseLeave={handleMouseLeave}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Timeline container with sticky all-day section */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Sticky pinned area: weather + all-day events */}
        {(dayWeather || allDayEvents.length > 0) && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: zIndices.stickyArea + 1,
              background: colors.bg,
              marginBottom: `${spacing.md}px`,
            }}
          >
            {/* Weather section - single row */}
            {dayWeather && (
              <div
                style={{
                  borderBottom:
                    allDayEvents.length > 0
                      ? `1px solid ${colors.borderLight}`
                      : `1px solid ${colors.border}`,
                  padding: `${spacing.sm}px ${spacing.xl}px`,
                }}
              >
                <div
                  onMouseEnter={(e) => showTooltip(dayWeather, e.clientX, e.clientY)}
                  onMouseLeave={hideTooltip}
                  className="hover-bg"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    cursor: 'pointer',
                    padding: `${spacing.xs}px ${spacing.sm}px`,
                    borderRadius: `${radii.lg}px`,
                  }}
                >
                  <WeatherIcon condition={dayWeather.icon} size="medium" />
                  <span style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                    {Math.round(dayWeather.high)}°
                  </span>
                  <span style={{ fontSize: '14px', color: colors.textMuted }}>
                    {Math.round(dayWeather.low)}°
                  </span>
                  <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                    {dayWeather.condition}
                  </span>
                  {dayWeather.humidity != null && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Droplet size={12} color="#60A5FA" style={{ opacity: 0.85 }} />
                      {dayWeather.humidity}%
                    </span>
                  )}
                  {dayWeather.wind_speed != null && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Wind size={12} color="#94A3B8" />
                      {Math.round(dayWeather.wind_speed)} mph
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* All-day events section */}
            {allDayEvents.length > 0 && (
              <div
                style={{
                  padding: `${spacing.sm}px ${spacing.xl}px`,
                  borderTop: dayWeather ? 'none' : `1px solid ${colors.border}`,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: `${typography.allDayLabel.size}px`,
                    fontWeight: typography.allDayLabel.weight,
                    color: colors.textFaint,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
                >
                  All-day
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {allDayEvents.map((event) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      members={members}
                      variant="card"
                      size="sm"
                      showTime={false}
                      onClick={openEvent}
                      onMouseEnter={(e) => handleDayMouseEnter(e, currentDate, event)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div
          style={{
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: `${radii['2xl']}px`,
            margin: `${spacing.lg}px ${spacing.xl}px 0`,
            position: 'relative',
          }}
        >
          {/* Hour rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              style={{
                display: 'flex',
                borderBottom: `1px solid ${colors.borderLight}`,
                minHeight: `${layout.timelineHourHeight}px`,
                position: 'relative',
              }}
            >
              {/* Time label */}
              <div
                style={{
                  width: `${layout.timelineLabelWidth}px`,
                  flexShrink: 0,
                  padding: `${spacing.sm}px ${spacing.md}px 0 0`,
                  textAlign: 'right',
                  fontSize: `${typography.timelineLabel.size}px`,
                  color: colors.textFaint,
                  fontWeight: typography.timelineLabel.weight,
                }}
              >
                {formatHour(hour)}
              </div>

              {/* Time slot */}
              <div
                className="hover-bg"
                style={{
                  flex: 1,
                  position: 'relative',
                  borderLeft: `1px solid ${colors.borderLight}`,
                  cursor: 'pointer',
                }}
              />
            </div>
          ))}

          {/* Event blocks */}
          {timedEvents.map((event) => {
            const top = getEventTopPx(event)
            const height = getEventHeightPx(event)

            return (
              <EventItem
                key={event.id}
                event={event}
                members={members}
                variant="block"
                style={{
                  position: 'absolute',
                  left: `${layout.timelineLabelWidth + 4}px`,
                  right: '4px',
                  top: `${top}px`,
                  height: `${height}px`,
                }}
                onClick={openEvent}
                onMouseEnter={(e) => handleDayMouseEnter(e, currentDate, event)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            )
          })}

          {/* Current time indicator */}
          {isToday && (
            <div
              style={{
                position: 'absolute',
                left: `${layout.timelineLabelWidth}px`,
                right: 0,
                top: `${currentTimeTop}px`,
                height: '2px',
                background: colors.danger,
                zIndex: zIndices.currentTimeLine,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '-5px',
                  top: '-4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: colors.danger,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Event popup - shown when hovering events */}
      {popupState.date && (
        <EventPopup
          visible={popupState.visible}
          x={popupState.x}
          y={popupState.y}
          dateLabel={formatDateParts(popupState.date, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          events={popupState.hoveredEvent ? [popupState.hoveredEvent] : []}
          members={members}
        />
      )}

      {/* Event detail modal */}
      <EventModal
        visible={selectedEvent !== null}
        event={selectedEvent}
        members={members}
        onClose={closeEvent}
      />

      {/* Weather tooltip */}
      <WeatherTooltip
        forecast={tooltipState.forecast}
        visible={tooltipState.visible}
        x={tooltipState.x}
        y={tooltipState.y}
      />
    </div>
  )
}
