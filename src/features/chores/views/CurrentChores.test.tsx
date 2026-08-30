/**
 * Tests for CurrentChores view.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrentChores } from './CurrentChores'
import type { ChoresData } from '@/types/chores'
import type { FamilyMember } from '@/types/family'

vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
  }
})

const mockMembers: FamilyMember[] = [
  { key: 'faiyaz', name: 'Faiyaz', color_key: 'blue', color: '#3b82f6', initial: 'F', calendar_id: 'cal1', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
]

const mockData: ChoresData = {
  categories: [{ id: 'cat-1', name: 'Kitchen' }],
  tags: [{ id: 'tag-1', name: 'Quick' }],
  master_chores: [
    {
      id: 'mc-1',
      name: 'Wipe Counter',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [{ id: 'tag-1', name: 'Quick' }],
      difficulty: 3,
      frequency: 'daily',
      frequency_interval: 1,
      day_of_week: null,
      day_of_month: null,
      week_of_month: null,
      month: null,
      estimated_minutes: 10,
      due_time: null,
      due_date: null,
      end_date: null,
      max_occurrences: null,
      occurrence_count: 45,
      conditions: null,
      is_collaborative: false,
      created_by: 'faiyaz',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      deleted_at: null,
    },
    {
      id: 'mc-2',
      name: 'Water Plants',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [],
      difficulty: 1,
      frequency: 'daily',
      frequency_interval: 1,
      day_of_week: null,
      day_of_month: null,
      week_of_month: null,
      month: null,
      estimated_minutes: 15,
      due_time: null,
      due_date: null,
      end_date: null,
      max_occurrences: null,
      occurrence_count: 28,
      conditions: null,
      is_collaborative: false,
      created_by: 'faiyaz',
      status: 'inactive',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      deleted_at: null,
    },
    {
      id: 'mc-3',
      name: 'Deep Clean Oven',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [],
      difficulty: 5,
      frequency: 'once',
      frequency_interval: 1,
      day_of_week: null,
      day_of_month: null,
      week_of_month: null,
      month: null,
      estimated_minutes: 60,
      due_time: null,
      due_date: null,
      end_date: null,
      max_occurrences: null,
      occurrence_count: 5,
      conditions: null,
      is_collaborative: false,
      created_by: 'faiyaz',
      status: 'archived',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      deleted_at: null,
    },
  ],
  associations: [],
  instances: [],
}

const defaultProps = {
  members: mockMembers,
  data: mockData as ChoresData | null,
  isLoading: false,
  error: null as string | null,
  selectedIds: new Set<string>(),
  onToggleSelect: vi.fn(),
  onEditMaster: vi.fn(),
  onToggleStatus: vi.fn(),
  onArchive: vi.fn(),
}

function renderView(overrides: Partial<typeof defaultProps> = {}) {
  return render(<CurrentChores {...defaultProps} {...overrides} />)
}

describe('CurrentChores', () => {
  it('renders loading state', () => {
    renderView({ isLoading: true, data: null })
    expect(screen.getByText('Loading chores...')).toBeTruthy()
  })

  it('renders error state', () => {
    renderView({ error: 'Failed to load', data: null })
    expect(screen.getByText('Error loading chores: Failed to load')).toBeTruthy()
  })

  it('renders null when no data and not loading', () => {
    const { container } = renderView({ data: null })
    expect(container.firstChild).toBeNull()
  })

  it('renders active masters', () => {
    renderView()
    expect(screen.getByText('Wipe Counter')).toBeTruthy()
  })

  it('renders inactive masters', () => {
    renderView()
    expect(screen.getByText('Water Plants')).toBeTruthy()
  })

  it('does not render archived masters', () => {
    renderView()
    expect(screen.queryByText('Deep Clean Oven')).toBeNull()
  })

  it('renders empty state when no current masters', () => {
    const emptyData: ChoresData = {
      categories: mockData.categories,
      tags: mockData.tags,
      associations: [],
      instances: [],
      master_chores: [
        {
          id: 'mc-archived',
          name: 'Old Chore',
          category: { id: 'cat-1', name: 'Kitchen' },
          tags: [],
          difficulty: 3,
          frequency: 'daily',
          frequency_interval: 1,
          day_of_week: null,
          day_of_month: null,
          week_of_month: null,
          month: null,
          estimated_minutes: 10,
          due_time: null,
          due_date: null,
          end_date: null,
          max_occurrences: null,
          occurrence_count: 0,
          conditions: null,
          is_collaborative: false,
          created_by: 'faiyaz',
          status: 'archived',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          deleted_at: null,
        },
      ],
    }
    renderView({ data: emptyData })
    expect(screen.getByText('No chores found')).toBeTruthy()
  })

  it('renders correct number of cards', () => {
    renderView()
    // Should show 2 cards (active + inactive), not archived
    expect(screen.getByText('Wipe Counter')).toBeTruthy()
    expect(screen.getByText('Water Plants')).toBeTruthy()
    expect(screen.queryByText('Deep Clean Oven')).toBeNull()
  })
})
