/**
 * useEventInteraction — unified popup/modal interaction state for calendar views.
 *
 * Consolidates the hover-popup state previously duplicated in MonthView and
 * YearView, plus the modal selection state from DayView. All views share one
 * interaction rule: hovering a day/event shows the EventPopup, clicking an
 * event opens the EventModal.
 */

import { useState, useCallback } from 'react'
import type { CalendarEvent } from '@/types'
import { eventDate } from '@/shared/date'

interface PopupState {
  visible: boolean
  x: number
  y: number
  date: Temporal.PlainDate | null
  /** The specific event being hovered (null when hovering a day cell). */
  hoveredEvent: CalendarEvent | null
}

const HIDDEN_POPUP: PopupState = { visible: false, x: 0, y: 0, date: null, hoveredEvent: null }

/**
 * useEventInteraction hook.
 *
 * @param events - Calendar events (used to decide whether a hovered day has events).
 * @returns Popup/modal state and handlers.
 */
export function useEventInteraction(events: CalendarEvent[]) {
  const [popupState, setPopupState] = useState<PopupState>(HIDDEN_POPUP)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  /**
   * Show the popup when the hovered day has events, hide otherwise.
   *
   * @param e - Mouse event for cursor position.
   * @param date - The date being hovered.
   * @param event - Optional specific event being hovered (for per-event popups).
   */
  const handleDayMouseEnter = useCallback(
    (e: React.MouseEvent, date: Temporal.PlainDate, event?: CalendarEvent) => {
      const hasEvents = events.some((ev) => eventDate(ev.start).equals(date))
      setPopupState(
        hasEvents
          ? { visible: true, x: e.clientX, y: e.clientY, date, hoveredEvent: event ?? null }
          : HIDDEN_POPUP,
      )
    },
    [events],
  )

  /** Track the cursor while the popup is visible. */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPopupState((prev) => (prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev))
  }, [])

  /** Hide the popup. */
  const handleMouseLeave = useCallback(() => {
    setPopupState(HIDDEN_POPUP)
  }, [])

  /** Open the event detail modal. */
  const openEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
  }, [])

  /** Close the event detail modal. */
  const closeEvent = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  return {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  }
}
