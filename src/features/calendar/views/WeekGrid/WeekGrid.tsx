import type { CalendarEvent, DailyForecast, FamilyMember } from '@/types'
import { DayCard } from '@/features/calendar/components/DayCard'
import { EventPopup } from '@/features/calendar/components/EventPopup'
import { EventModal } from '@/features/calendar/components/EventModal'
import { spacing } from '@/theme/tokens'
import { themeConfig } from '@/theme/config'
import { getWeekDays, today, formatDateParts } from '@/shared/date'
import { getRelativeDensity } from '@/shared/utils/density'
import { getEventsForDate } from '@/domain/calendar/utils'
import { getWeatherForDate } from '@/domain/weather/utils'
import { useEventInteraction } from '@/features/calendar/hooks/useEventInteraction'

interface WeekGridProps {
  events: CalendarEvent[]
  members: FamilyMember[]
  orientation: 'landscape' | 'portrait'
  /** The current date for the week view (used for navigation). */
  currentDate: Temporal.PlainDate
  /** Callback when a day card is clicked. */
  onDayClick?: (date: Temporal.PlainDate) => void
  /** Weather forecast data for the next 16 days. */
  weatherForecast?: DailyForecast[]
}

export function WeekGrid({
  events,
  members,
  orientation,
  currentDate,
  onDayClick,
  weatherForecast,
}: WeekGridProps) {
  const {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  } = useEventInteraction(events)

  const todayDate = today()
  const weekDays = getWeekDays(currentDate)
  const nextWeekStart = weekDays[6]!.add({ days: 1 })
  const nextWeekEnd = nextWeekStart.add({ days: 6 })

  const cols =
    orientation === 'landscape'
      ? themeConfig.calendar.weekGridLandscape
      : themeConfig.calendar.weekGridPortrait
  const rows = Math.ceil(themeConfig.calendar.weekDaysCount / cols)

  // Calculate event counts for each day to determine density
  const dayCounts = weekDays.map((date) => getEventsForDate(events, date).length)

  return (
    <div onMouseLeave={handleMouseLeave} style={{ height: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: `${spacing.lg}px`,
          height: '100%',
        }}
      >
        {weekDays.map((date, idx) => {
          const dayWeather = getWeatherForDate(weatherForecast, date)
          return (
            <DayCard
              key={date.toString()}
              date={date}
              events={getEventsForDate(events, date)}
              members={members}
              isToday={date.equals(todayDate)}
              density={getRelativeDensity(dayCounts[idx]!, dayCounts)}
              {...(onDayClick ? { onClick: () => onDayClick(date) } : {})}
              onEventClick={openEvent}
              onEventMouseEnter={handleDayMouseEnter}
              onEventMouseMove={handleMouseMove}
              onEventMouseLeave={handleMouseLeave}
              {...(dayWeather ? { weatherForecast: dayWeather } : {})}
            />
          )
        })}
        <DayCard
          date={nextWeekStart}
          nextWeekEnd={nextWeekEnd}
          events={[]}
          members={members}
          isToday={false}
          isNextWeek
        />
      </div>

      {/* Event popup - key forces full re-render when date changes */}
      {popupState.date && (
        <EventPopup
          key={popupState.date.toString()}
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
    </div>
  )
}
