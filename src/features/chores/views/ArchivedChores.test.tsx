/**
 * Tests for ArchivedChores view.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchivedChores } from './ArchivedChores'
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
      recurrence_rule: { frequency: 'daily', time: '18:00' },
      estimated_minutes: 10,
      due_time: null,
      due_date: null,
      expiration_behavior: 'carry_over',
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
      recurrence_rule: { frequency: 'daily', time: '08:00' },
      estimated_minutes: 15,
      due_time: null,
      due_date: null,
      expiration_behavior: 'carry_over',
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
      recurrence_rule: null,
      estimated_minutes: 60,
      due_time: null,
      due_date: null,
      expiration_behavior: 'carry_over',
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
    {
      id: 'mc-4',
      name: 'Clean Garage',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [],
      difficulty: 4,
      recurrence_rule: { frequency: 'monthly', day_of_month: 1, time: '09:00' },
      estimated_minutes: 120,
      due_time: null,
      due_date: null,
      expiration_behavior: 'carry_over',
      end_date: null,
      max_occurrences: null,
      occurrence_count: 3,
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
  onEditMaster: vi.fn(),
  onRestore: vi.fn(),
}

function renderView(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ArchivedChores {...defaultProps} {...overrides} />)
}

describe('ArchivedChores', () => {
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

  it('renders archived masters', () => {
    renderView()
    expect(screen.getByText('Deep Clean Oven')).toBeTruthy()
    expect(screen.getByText('Clean Garage')).toBeTruthy()
  })

  it('does not render active masters', () => {
    renderView()
    expect(screen.queryByText('Wipe Counter')).toBeNull()
  })

  it('does not render inactive masters', () => {
    renderView()
    expect(screen.queryByText('Water Plants')).toBeNull()
  })

  it('renders empty state when no archived masters', () => {
    const noArchivedData: ChoresData = {
      categories: mockData.categories,
      tags: mockData.tags,
      associations: [],
      instances: [],
      master_chores: [
        {
          id: 'mc-active',
          name: 'Active Chore',
          category: { id: 'cat-1', name: 'Kitchen' },
          tags: [],
          difficulty: 3,
          recurrence_rule: { frequency: 'daily', time: '18:00' },
          estimated_minutes: 10,
          due_time: null,
          due_date: null,
          expiration_behavior: 'carry_over',
          end_date: null,
          max_occurrences: null,
          occurrence_count: 0,
          conditions: null,
          is_collaborative: false,
          created_by: 'faiyaz',
          status: 'active',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          deleted_at: null,
        },
      ],
    }
    renderView({ data: noArchivedData })
    expect(screen.getByText('No archived chores found')).toBeTruthy()
  })

  it('renders correct number of archived cards', () => {
    renderView()
    expect(screen.getByText('Deep Clean Oven')).toBeTruthy()
    expect(screen.getByText('Clean Garage')).toBeTruthy()
    expect(screen.queryByText('Wipe Counter')).toBeNull()
    expect(screen.queryByText('Water Plants')).toBeNull()
  })
})
