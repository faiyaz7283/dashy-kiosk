/**
 * Tests for AppShell component.
 *
 * Validates app shell renders header, sidebar, status bar, and content area.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppShell from './AppShell'
import { NotificationProvider } from '@/shared/context/NotificationContext'
import { formatHeaderDate, today } from '@/shared/date'

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {ui}
      </NotificationProvider>
    </QueryClientProvider>
  )
}

// Mock the data hooks
vi.mock('@/shared/hooks/useFamilyData', () => ({
  useFamilyData: () => ({
    members: [
      { key: 'faiyaz', name: 'Faiyaz', color: 'blue', initial: 'F', calendar_id: 'cal1', color_key: 'blue', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
      { key: 'trisha', name: 'Trisha', color: 'pink', initial: 'T', calendar_id: 'cal2', color_key: 'pink', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
    ],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/features/calendar/hooks/useCalendarData', () => ({
  useCalendarData: () => ({
    events: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/features/weather/hooks/useWeatherData', () => ({
  useWeatherData: () => ({
    current: {
      temperature: 72,
      feels_like: 70,
      condition: 'clear',
      humidity: 45,
      wind_speed: 5,
    },
    forecast: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/features/chores/hooks/useChoresData', () => ({
  useChoresData: () => ({
    data: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/shared/hooks/useClock', () => ({
  useClock: () => Temporal.PlainTime.from('18:30:00'),
}))

describe('AppShell', () => {
  it('renders header with current date', () => {
    renderWithQueryClient(<AppShell />)
    const expectedDate = formatHeaderDate(today())
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    renderWithQueryClient(<AppShell />)
    expect(screen.getByRole('button', { name: /Calendar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chores/i })).toBeInTheDocument()
  })

  it('renders status bar', () => {
    renderWithQueryClient(<AppShell />)
    expect(screen.getByTitle('Settings')).toBeInTheDocument()
  })

  it('renders content area with calendar view by default', () => {
    renderWithQueryClient(<AppShell />)
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('applies correct layout classes', () => {
    const { container } = renderWithQueryClient(<AppShell />)
    const root = container.firstElementChild
    expect(root).toHaveClass('h-screen', 'w-full')
  })
})
