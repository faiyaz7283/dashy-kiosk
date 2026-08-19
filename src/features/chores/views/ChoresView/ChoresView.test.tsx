/**
 * Tests for the ChoresView component.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChoresView } from './ChoresView'
import type { FamilyMember } from '@/types'

const mockMembers: FamilyMember[] = [
  { name: 'Faiyaz', key: 'faiyaz', calendar_id: 'f@x.com', color: '#4A90E2', initial: 'F' },
  { name: 'Trisha', key: 'trisha', calendar_id: 't@x.com', color: '#E24A8D', initial: 'T' },
]

// Mock the useChores hook
vi.mock('@/features/chores/hooks/useChores', () => ({
  useChores: vi.fn(),
}))

// Mock the useChoreActions hook
vi.mock('@/features/chores/hooks/useChoreActions', () => ({
  useChoreActions: () => ({
    createMaster: vi.fn(),
    updateMaster: vi.fn(),
    deleteMaster: vi.fn(),
    claimInstance: vi.fn(),
    assignInstance: vi.fn(),
    updateStatus: vi.fn(),
    createCategory: vi.fn(),
    createTag: vi.fn(),
    approveMaster: vi.fn(),
  }),
}))

// Mock useUiScale (used by ChoreModal)
vi.mock('@/features/kiosk/hooks/useUiScale', () => ({
  useUiScale: () => 1,
}))

import { useChores } from '@/features/chores/hooks/useChores'

const mockUseChores = vi.mocked(useChores)

describe('ChoresView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', () => {
    mockUseChores.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
      lastRefresh: null,
    })

    render(<ChoresView members={mockMembers} />)
    expect(screen.getByText('Loading chores...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseChores.mockReturnValue({
      data: null,
      loading: false,
      error: 'Network error',
      refetch: vi.fn(),
      lastRefresh: null,
    })

    render(<ChoresView members={mockMembers} />)
    expect(screen.getByText(/Error loading chores: Network error/)).toBeInTheDocument()
  })

  it('renders chore board when data is loaded', () => {
    mockUseChores.mockReturnValue({
      data: {
        categories: [{ id: 'cat-1', name: 'Kitchen' }],
        tags: [],
        master_chores: [
          {
            id: 'mc-1',
            name: 'Test Chore',
            category: { id: 'cat-1', name: 'Kitchen' },
            tags: [],
            difficulty: 1,
            frequency: 'daily',
            estimated_minutes: null,
            due_time: null,
            due_date: null,
            expiration_behavior: 'disappear',
            created_by: 'trisha',
            approved_by: null,
            status: 'active',
            created_at: '2026-08-01T00:00:00Z',
            updated_at: '2026-08-01T00:00:00Z',
          },
        ],
        instances: [
          {
            id: 'inst-1',
            master_chore_id: 'mc-1',
            period_start: '2026-08-18',
            period_end: '2026-08-19',
            status: 'open',
            claimed_by: null,
            assigned_to: null,
            assigned_by: null,
            completed_by: null,
            signoff_by: null,
            started_at: null,
            completed_at: null,
            signed_off_at: null,
          },
        ],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
      lastRefresh: Date.now(),
    })

    render(<ChoresView members={mockMembers} />)

    // Should show the metrics bar
    expect(screen.getByText('Active')).toBeInTheDocument()
    // Should show open pool (1 unclaimed instance)
    expect(screen.getByText('Open Pool')).toBeInTheDocument()
    // Should show member columns
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
    expect(screen.getByText('Trisha')).toBeInTheDocument()
    // Should show the chore name
    expect(screen.getByText('Test Chore')).toBeInTheDocument()
  })

  it('renders nothing when data is null and not loading', () => {
    mockUseChores.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
      lastRefresh: null,
    })

    const { container } = render(<ChoresView members={mockMembers} />)
    // Should render nothing visible
    expect(container.innerHTML).toBe('')
  })
})
