/**
 * Tests for ChoreCard component.
 *
 * Validates chore card renders instance details, action buttons, and compact styling.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoreCard } from './ChoreCard'
import type { ChoreInstance, MasterChore, ChoreCategory } from '@/types/chores'
import type { PaletteKey } from '@/shared/utils/memberColors'

// Mock useConfig to return a fixed timezone
vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
  }
})

describe('ChoreCard', () => {
  const mockCategories: ChoreCategory[] = [
    { id: 'cat-1', name: 'Kitchen' },
    { id: 'cat-2', name: 'Bathroom' },
  ]

  const mockMasterChore: MasterChore = {
    id: 'master-1',
    name: 'Wipe Counter',
    category: { id: 'cat-1', name: 'Kitchen' },
    tags: [],
    difficulty: 3,
    recurrence_rule: { frequency: 'daily', time: '18:00' },
    estimated_minutes: 10,
    due_time: '22:00',
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
  }

  const mockInstance: ChoreInstance = {
    id: 'instance-1',
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
  }

  const mockColorMap = new Map<string, PaletteKey>([
    ['faiyaz', 'blue'],
    ['trisha', 'pink'],
  ])

  it('renders chore name', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Wipe Counter')).toBeInTheDocument()
  })

  it('renders category name', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
  })

  it('renders frequency', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('daily')).toBeInTheDocument()
  })

  it('renders difficulty dots', () => {
    const { container } = render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    // Should have 5 difficulty dots (compact h-1 w-1)
    const dots = container.querySelectorAll('.h-1.w-1')
    expect(dots.length).toBe(5)
  })

  it('renders estimated time', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('10m')).toBeInTheDocument()
  })

  it('renders assignment status for open chore', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Unclaimed')).toBeInTheDocument()
  })

  it('renders assignment status for claimed chore', () => {
    const claimedInstance = { ...mockInstance, claimed_by: 'faiyaz', status: 'active' as const }
    render(
      <ChoreCard
        instance={claimedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Claimed by faiyaz')).toBeInTheDocument()
  })

  it('renders assignment status for assigned chore', () => {
    const assignedInstance = {
      ...mockInstance,
      assigned_to: 'trisha',
      assigned_by: 'faiyaz',
      status: 'active' as const,
    }
    render(
      <ChoreCard
        instance={assignedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Assigned by faiyaz to trisha')).toBeInTheDocument()
  })

  it('renders completion status', () => {
    const completedInstance = {
      ...mockInstance,
      completed_by: 'trisha',
      status: 'completed' as const,
    }
    render(
      <ChoreCard
        instance={completedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Completed by trisha')).toBeInTheDocument()
  })

  it('shows "Uncategorized" when category not found', () => {
    const masterWithUnknownCategory = {
      ...mockMasterChore,
      category: { id: 'unknown', name: 'Unknown' },
    }
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={masterWithUnknownCategory}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })

  it('renders Start button for active instance', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('renders Complete button for in_progress instance', () => {
    const inProgressInstance = { ...mockInstance, status: 'in_progress' as const }
    render(
      <ChoreCard
        instance={inProgressInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('does not render action button for completed instance', () => {
    const completedInstance = { ...mockInstance, status: 'completed' as const }
    render(
      <ChoreCard
        instance={completedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.queryByText('Start')).not.toBeInTheDocument()
    expect(screen.queryByText('Complete')).not.toBeInTheDocument()
  })

  it('calls onStart when Start button is clicked', () => {
    const onStart = vi.fn()
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
        onStart={onStart}
      />
    )
    screen.getByText('Start').click()
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete when Complete button is clicked', () => {
    const onComplete = vi.fn()
    const inProgressInstance = { ...mockInstance, status: 'in_progress' as const }
    render(
      <ChoreCard
        instance={inProgressInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
        onComplete={onComplete}
      />
    )
    screen.getByText('Complete').click()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
