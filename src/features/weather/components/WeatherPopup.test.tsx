/**
 * Tests for WeatherPopup component.
 *
 * Validates weather popup renders weather details correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WeatherPopup } from './WeatherPopup'
import type { DailyForecast } from '@/types/weather'

// Mock fetch for config endpoint
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockFetch.mockReset()
  // Mock config endpoint to return America/New_York timezone
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ timezone: 'America/New_York' }),
  })
})

describe('WeatherPopup', () => {
  const mockForecast: DailyForecast = {
    date: '2026-01-15',
    high: 75,
    low: 60,
    condition: 'clear',
    icon: 'clear',
    feels_like_day: 72,
    humidity: 45,
    wind_speed: 8,
    pressure: 1013,
    uvi: 6,
    sunrise: '06:30',
    sunset: '19:45',
    pop: 0.2,
    rain: 0,
  }

  it('renders temperature', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('75°F')).toBeInTheDocument()
  })

  it('renders condition', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('clear')).toBeInTheDocument()
  })

  it('renders date labels', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Jan 15')).toBeInTheDocument()
  })

  it('renders feels like temperature', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Feels Like')).toBeInTheDocument()
    expect(screen.getByText('72°F')).toBeInTheDocument()
  })

  it('renders humidity', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Humidity')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('renders wind speed', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Wind')).toBeInTheDocument()
    expect(screen.getByText('8 mph')).toBeInTheDocument()
  })

  it('renders UV index when present', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('UV Index')).toBeInTheDocument()
    expect(screen.getByText('6 (High)')).toBeInTheDocument()
  })

  it('does not render UV index when not present', () => {
    const forecastWithoutUV = { ...mockForecast, uvi: null }
    renderWithProviders(
      <WeatherPopup
        forecast={forecastWithoutUV}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.queryByText('UV Index')).not.toBeInTheDocument()
  })

  it('renders pressure when present', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Pressure')).toBeInTheDocument()
    expect(screen.getByText('1013 hPa')).toBeInTheDocument()
  })

  it('renders sunrise when present', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Sunrise')).toBeInTheDocument()
    // Sunrise time is converted from UTC (06:30) to configured timezone (America/New_York)
    expect(screen.getByText('2:30 AM')).toBeInTheDocument()
  })

  it('renders sunset when present', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    // Sunset time is converted from UTC (19:45) to configured timezone (America/New_York)
    expect(screen.getByText('3:45 PM')).toBeInTheDocument()
  })

  it('renders moon phase placeholder', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Moon')).toBeInTheDocument()
  })

  it('renders precipitation when forecast has pop', () => {
    renderWithProviders(
      <WeatherPopup
        forecast={mockForecast}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.getByText('Precipitation')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('does not render precipitation when forecast not provided', () => {
    const forecastWithoutPop = { ...mockForecast, pop: null }
    renderWithProviders(
      <WeatherPopup
        forecast={forecastWithoutPop}
        dateLabel="Today"
        dateSublabel="Jan 15"
      />
    )
    expect(screen.queryByText('Precipitation')).not.toBeInTheDocument()
  })

  it('renders UV label correctly for different values', () => {
    const testCases = [
      { uvi: 1, expected: '1 (Low)' },
      { uvi: 3, expected: '3 (Moderate)' },
      { uvi: 6, expected: '6 (High)' },
      { uvi: 8, expected: '8 (Very High)' },
      { uvi: 11, expected: '11 (Extreme)' },
    ]

    testCases.forEach(({ uvi, expected }) => {
      const { unmount } = renderWithProviders(
        <WeatherPopup
          forecast={{ ...mockForecast, uvi }}
          dateLabel="Today"
          dateSublabel="Jan 15"
        />
      )
      expect(screen.getByText(expected)).toBeInTheDocument()
      unmount()
    })
  })
})
