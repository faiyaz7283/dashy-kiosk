/**
 * Tests for EventPopup component.
 *
 * Validates event popup renders event details correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { EventPopup } from './EventPopup'
import type { CalendarEvent } from '@/types/calendar'
import { createTestQueryClient, createQueryClientWrapper } from '@/test/test-utils'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = createTestQueryClient()
})

afterEach(() => {
  queryClient.clear()
})

describe('EventPopup', () => {
  const mockEvent: CalendarEvent = {
    id: 'test-event-1',
    title: 'Team Meeting',
    start: Temporal.PlainDateTime.from('2026-01-15T10:00:00'),
    end: Temporal.PlainDateTime.from('2026-01-15T11:00:00'),
    startIso: '2026-01-15T10:00:00+00:00',
    endIso: '2026-01-15T11:00:00+00:00',
    members: ['faiyaz'],
    location: 'Conference Room A',
    description: 'Weekly team sync',
    is_recurring_instance: false,
    recurrence_rule: null,
  }

  it('renders event title', () => {
    render(<EventPopup event={mockEvent} />, { wrapper: createQueryClientWrapper(queryClient) })
    expect(screen.getByText('Team Meeting')).toBeInTheDocument()
  })

  it('shows time information', () => {
    render(<EventPopup event={mockEvent} />, { wrapper: createQueryClientWrapper(queryClient) })
    // Time is formatted as "10:00 AM – 11:00 AM"
    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument()
  })

  it('shows location if present', () => {
    render(<EventPopup event={mockEvent} />, { wrapper: createQueryClientWrapper(queryClient) })
    expect(screen.getByText('Conference Room A')).toBeInTheDocument()
  })

  it('shows description if present', () => {
    render(<EventPopup event={mockEvent} />, { wrapper: createQueryClientWrapper(queryClient) })
    expect(screen.getByText('Weekly team sync')).toBeInTheDocument()
  })

  it('does not show location if not present', () => {
    const { location, ...eventWithoutLocation } = mockEvent
    render(<EventPopup event={eventWithoutLocation} />, { wrapper: createQueryClientWrapper(queryClient) })
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument()
  })

  it('does not show description if not present', () => {
    const eventWithoutDescription = { ...mockEvent, description: null }
    render(<EventPopup event={eventWithoutDescription} />, { wrapper: createQueryClientWrapper(queryClient) })
    expect(screen.queryByText('Weekly team sync')).not.toBeInTheDocument()
  })

  it('shows recurrence icon for recurring events', () => {
    const recurringEvent = { ...mockEvent, is_recurring_instance: true }
    render(<EventPopup event={recurringEvent} />, { wrapper: createQueryClientWrapper(queryClient) })
    // Recurrence icon should be present (check for the icon container)
    const recurrenceContainer = screen.getByText('Team Meeting').closest('div')
    expect(recurrenceContainer?.querySelector('svg')).toBeInTheDocument()
  })

  it('shows attendees grid if present', () => {
    const eventWithAttendees: CalendarEvent = {
      ...mockEvent,
      attendees: [
        { member_key: 'faiyaz', email: 'faiyaz@test.com', display_name: 'Faiyaz', status: 'accepted', color: '#3b82f6', color_key: 'blue' },
        { member_key: 'trisha', email: 'trisha@test.com', display_name: 'Trisha', status: 'tentative', color: '#ec4899', color_key: 'pink' },
      ],
    }
    render(<EventPopup event={eventWithAttendees} />, { wrapper: createQueryClientWrapper(queryClient) })
    // Attendees are shown by their status, not name
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByText('Tentative')).toBeInTheDocument()
  })

  it('formats attendee status correctly', () => {
    const eventWithAttendees: CalendarEvent = {
      ...mockEvent,
      attendees: [
        { member_key: 'faiyaz', email: 'faiyaz@test.com', display_name: 'Faiyaz', status: 'accepted', color: '#3b82f6', color_key: 'blue' },
        { member_key: 'trisha', email: 'trisha@test.com', display_name: 'Trisha', status: 'declined', color: '#ec4899', color_key: 'pink' },
      ],
    }
    render(<EventPopup event={eventWithAttendees} />, { wrapper: createQueryClientWrapper(queryClient) })
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByText('Declined')).toBeInTheDocument()
  })
})
