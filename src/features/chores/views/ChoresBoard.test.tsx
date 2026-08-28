/**
 * Tests for ChoresBoard component.
 *
 * Validates chores board renders per-column metrics and member columns correctly.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoresBoard } from './ChoresBoard'
import type { FamilyMember } from '@/types/family'
import type { ChoresData, MasterChore } from '@/types/chores'

// Mock useConfig to return a fixed timezone
vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
  }
})

describe('ChoresBoard', () => {
  const mockMembers: FamilyMember[] = [
    { key: 'faiyaz', name: 'Faiyaz', color: 'blue', initial: 'F', calendar_id: 'cal1', color_key: 'blue', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
    { key: 'trisha', name: 'Trisha', color: 'pink', initial: 'T', calendar_id: 'cal2', color_key: 'pink', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
  ]

  const mockData: ChoresData = {
    categories: [{ id: 'cat-1', name: 'Kitchen' }],
    tags: [{ id: 'tag-1', name: 'Quick' }],
    master_chores: [
      {
        id: 'master-1',
        name: 'Wipe Counter',
        category: { id: 'cat-1', name: 'Kitchen' },
        tags: [],
        difficulty: 3,
        recurrence_rule: { frequency: 'daily', time: '18:00' },
        estimated_minutes: 10,
        due_time: '18:00',
        due_date: null,
        expiration_behavior: 'stay_visible',
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
    associations: [],
    instances: [
      {
        id: 'instance-1',
        master_chore_id: 'master-1',
        association_id: null,
        status: 'active',
        period_start: '2026-01-15',
        period_end: '2026-01-16',
        assigned_to: 'faiyaz',
        assigned_by: 'trisha',
        claimed_by: null,
        completed_by: null,
        started_at: null,
        completed_at: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'instance-2',
        master_chore_id: 'master-1',
        association_id: null,
        status: 'active',
        period_start: '2026-01-15',
        period_end: '2026-01-16',
        assigned_to: null,
        assigned_by: null,
        claimed_by: null,
        completed_by: null,
        started_at: null,
        completed_at: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ],
  }

  it('renders loading state', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={null}
        isLoading={true}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getByText('Loading chores...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={null}
        isLoading={false}
        isRefreshing={false}
        error="Failed to load"
      />
    )
    expect(screen.getByText('Error loading chores: Failed to load')).toBeInTheDocument()
  })

  it('renders member columns', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={mockData}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
    expect(screen.getByText('Trisha')).toBeInTheDocument()
  })

  it('renders open pool column', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={mockData}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getByText('Open Pool')).toBeInTheDocument()
  })

  it('renders metric labels in each column', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={mockData}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    // Open Pool column has 3 metrics: Total, Over, Today
    // Member columns have 5 metrics: Asn, Clm, Prog, Done, Over
    // 1 Open Pool + 2 member columns
    expect(screen.getAllByText('Total').length).toBe(1)
    expect(screen.getAllByText('Asn').length).toBe(2)
    expect(screen.getAllByText('Clm').length).toBe(2)
    expect(screen.getAllByText('Prog').length).toBe(2)
    expect(screen.getAllByText('Done').length).toBe(2)
    expect(screen.getAllByText('Over').length).toBe(3)
    expect(screen.getAllByText('Today').length).toBe(1)
  })

  it('renders null when no data and not loading', () => {
    const { container } = render(
      <ChoresBoard
        members={mockMembers}
        data={null}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('filters out archived instances from board display', () => {
    const archivedMaster: MasterChore = {
      id: 'master-archived',
      name: 'Archived Chore',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [],
      difficulty: 3,
      recurrence_rule: { frequency: 'daily', time: '18:00' },
      estimated_minutes: 10,
      due_time: '18:00',
      due_date: null,
      expiration_behavior: 'disappear',
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
    }

    const dataWithArchived: ChoresData = {
      ...mockData,
      master_chores: [...mockData.master_chores, archivedMaster],
      instances: [
        ...mockData.instances,
        {
          id: 'instance-archived',
          master_chore_id: 'master-archived',
          association_id: null,
          status: 'archived',
          period_start: '2026-01-15',
          period_end: '2026-01-16',
          assigned_to: 'faiyaz',
          assigned_by: 'trisha',
          claimed_by: null,
          completed_by: null,
          started_at: null,
          completed_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    }

    render(
      <ChoresBoard
        members={mockMembers}
        data={dataWithArchived}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )

    // Archived instance's master chore should not appear on the board
    expect(screen.queryByText('Archived Chore')).not.toBeInTheDocument()
    // Active instances should still appear (2 instances of "Wipe Counter" — one in Faiyaz column, one in Open Pool)
    expect(screen.getAllByText('Wipe Counter').length).toBe(2)
  })
})
