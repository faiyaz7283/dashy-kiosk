/**
 * Tests for CalendarDataContext — verifies provider behavior and context consumption.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CalendarDataProvider, useCalendarContext } from './CalendarDataContext'
import type { CalendarView } from '@/types'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const mockCalendarResponse = {
  events: [
    {
      id: 'evt-1',
      title: 'Test Event',
      start: '2025-01-15T10:00:00',
      end: '2025-01-15T11:00:00',
      all_day: false,
      members: ['alice'],
      location: null,
      description: null,
      is_recurring: false,
      recurrence_rule: null,
      attendees: [],
    },
  ],
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function TestConsumer() {
  const context = useCalendarContext()
  return (
    <div>
      <div data-testid="loading">{context.isLoading ? 'true' : 'false'}</div>
      <div data-testid="events-count">{context.events.length}</div>
      <div data-testid="error">{context.error || 'none'}</div>
    </div>
  )
}

function renderWithProviders(ui: React.ReactElement, queryClient: QueryClient) {
  const currentDate = Temporal.PlainDate.from('2025-01-15')
  const currentView: CalendarView = 'week'

  return render(
    <QueryClientProvider client={queryClient}>
      <CalendarDataProvider currentView={currentView} currentDate={currentDate}>
        {ui}
      </CalendarDataProvider>
    </QueryClientProvider>
  )
}

describe('CalendarDataContext', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockFetch.mockReset()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('throws error when useCalendarContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function InvalidConsumer() {
      useCalendarContext()
      return null
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useCalendarContext must be used within a CalendarDataProvider'
    )

    consoleSpy.mockRestore()
  })

  it('provides calendar data to consumers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCalendarResponse),
    })

    renderWithProviders(<TestConsumer />, queryClient)

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true')

    // After fetch completes
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('events-count').textContent).toBe('1')
    expect(screen.getByTestId('error').textContent).toBe('none')
  })

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ detail: 'Database connection failed' }),
    })

    renderWithProviders(<TestConsumer />, queryClient)

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('error').textContent).toBe('Database connection failed')
    expect(screen.getByTestId('events-count').textContent).toBe('0')
  })

  it('computes correct date range for week view', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    })

    const currentDate = Temporal.PlainDate.from('2025-01-15') // Wednesday
    const currentView: CalendarView = 'week'

    render(
      <QueryClientProvider client={queryClient}>
        <CalendarDataProvider currentView={currentView} currentDate={currentDate}>
          <TestConsumer />
        </CalendarDataProvider>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const fetchCall = mockFetch.mock.calls[0]![0]
    // Week view should fetch Monday to Sunday
    expect(fetchCall).toContain('start_date=2025-01-13') // Monday
    expect(fetchCall).toContain('end_date=2025-01-19') // Sunday
  })
})
