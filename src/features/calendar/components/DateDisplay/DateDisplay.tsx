/**
 * DateDisplay component for showing the current date with a date picker.
 *
 * Displays a clickable date text that varies by view (day/week/month/year).
 * Clicking opens a DatePicker popup for date selection.
 * Uses the extracted DatePicker component for the calendar UI.
 */

import { useState, useCallback, useRef } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import type { CalendarView } from '@/types'
import { colors, radii, layout } from '@/theme/tokens'
import { getWeekDays } from '@/shared/date'
import { DatePicker } from '@/features/calendar/components/DatePicker'

interface DateDisplayProps {
  /** The current date to display. */
  currentDate: Temporal.PlainDate
  /** The current calendar view. */
  currentView: CalendarView
  /** Callback when a date is selected. */
  onDateChange: (date: Temporal.PlainDate) => void
  /** Compact mode (narrow viewports): shrink to content width. */
  compact?: boolean
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const shortMonthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Formats the date text based on the current view.
 *
 * @param date - The date to format.
 * @param view - The current view type.
 * @returns Formatted date string.
 */
function formatDateText(date: Temporal.PlainDate, view: CalendarView): string {
  switch (view) {
    case 'day':
      return `${dayNames[date.dayOfWeek % 7]}, ${shortMonthNames[date.month - 1]} ${date.day}, ${date.year}`
    case 'week': {
      const weekDays = getWeekDays(date)
      const monday = weekDays[0]!
      const sunday = weekDays[6]!
      if (monday.month === sunday.month) {
        return `${shortMonthNames[monday.month - 1]} ${monday.day} – ${sunday.day}, ${monday.year}`
      }
      return `${shortMonthNames[monday.month - 1]} ${monday.day} – ${shortMonthNames[sunday.month - 1]} ${sunday.day}, ${sunday.year}`
    }
    case 'month':
      return `${monthNames[date.month - 1]} ${date.year}`
    case 'year':
      return `${date.year}`
  }
}

/**
 * DateDisplay component — trigger button for the DatePicker.
 *
 * @param props - Component props.
 * @returns The date display with picker UI.
 */
export function DateDisplay({
  currentDate,
  currentView,
  onDateChange,
  compact = false,
}: DateDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Viewport rect of the trigger button, captured when the picker opens —
  // the picker portals to document.body and anchors to these coordinates.
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && containerRef.current) {
        setAnchorRect(containerRef.current.getBoundingClientRect())
      }
      return !prev
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        className="hover-date-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.lg}px`,
          cursor: 'pointer',
          width: compact ? 'auto' : `${layout.dateDisplayWidth}px`,
        }}
      >
        <Calendar
          style={{ width: '14px', height: '14px', color: colors.textFaint, flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'center',
          }}
        >
          {formatDateText(currentDate, currentView)}
        </span>
        <ChevronDown
          style={{ width: '12px', height: '12px', color: colors.textFaint, flexShrink: 0 }}
        />
      </button>

      <DatePicker
        currentDate={currentDate}
        currentView={currentView}
        onDateChange={onDateChange}
        isOpen={isOpen}
        onClose={handleClose}
        anchorRect={anchorRect}
      />
    </div>
  )
}
