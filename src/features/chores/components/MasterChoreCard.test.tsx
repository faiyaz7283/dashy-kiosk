/**
 * Tests for MasterChoreCard component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MasterChoreCard, type MasterCardActionVariant } from './MasterChoreCard'
import type {
  MasterChore,
  ChoreAssociation,
  ChoreCategory,
  ChoreTag,
} from '@/types/chores'

vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
  }
})

const mockCategories: ChoreCategory[] = [
  { id: 'cat-1', name: 'Kitchen' },
  { id: 'cat-2', name: 'Cleaning' },
]

const mockTags: ChoreTag[] = [
  { id: 'tag-1', name: 'Quick' },
  { id: 'tag-2', name: 'Evening' },
]

const mockAssociations: ChoreAssociation[] = [
  {
    id: 'assoc-1',
    master_chore_id: 'mc-1',
    member_id: 'faiyaz',
    is_open_pool: false,
    created_by: 'trisha',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    removed_at: null,
  },
  {
    id: 'assoc-2',
    master_chore_id: 'mc-1',
    member_id: 'trisha',
    is_open_pool: false,
    created_by: 'faiyaz',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    removed_at: null,
  },
]

function makeMaster(overrides: Partial<MasterChore> & { id: string }): MasterChore {
  return {
    name: 'Test Chore',
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
    ...overrides,
  }
}

const defaultProps = {
  master: makeMaster({ id: 'mc-1' }),
  categories: mockCategories,
  tags: mockTags,
  associations: mockAssociations,
  isSelected: false,
  actionVariant: 'current' as MasterCardActionVariant,
  onToggleSelect: vi.fn(),
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onArchive: vi.fn(),
}

type OverrideProps = Omit<Partial<typeof defaultProps>, 'actionVariant'> & {
  actionVariant?: MasterCardActionVariant
  onRestore?: (master: MasterChore) => void
}

function renderCard(overrides: OverrideProps = {}) {
  return render(<MasterChoreCard {...defaultProps} {...overrides} />)
}

describe('MasterChoreCard', () => {
  it('renders chore name', () => {
    renderCard()
    expect(screen.getByText('Test Chore')).toBeTruthy()
  })

  it('renders status badge for active master', () => {
    renderCard()
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('renders status badge for inactive master', () => {
    renderCard({ master: makeMaster({ id: 'mc-2', status: 'inactive' }) })
    expect(screen.getByText('Inactive')).toBeTruthy()
  })

  it('renders category name', () => {
    renderCard()
    expect(screen.getByText('Kitchen')).toBeTruthy()
  })

  it('renders tag names', () => {
    renderCard()
    expect(screen.getByText('Quick')).toBeTruthy()
  })

  it('renders "None" when no tags', () => {
    renderCard({ master: makeMaster({ id: 'mc-3', tags: [] }) })
    expect(screen.getAllByText('None').length).toBeGreaterThanOrEqual(1)
  })

  it('renders frequency summary', () => {
    renderCard()
    expect(screen.getByText('Daily at 2:00 PM')).toBeTruthy()
  })

  it('renders collaborative status', () => {
    renderCard({ master: makeMaster({ id: 'mc-4', is_collaborative: true }) })
    expect(screen.getByText('Yes')).toBeTruthy()
  })

  it('renders non-collaborative status', () => {
    renderCard()
    expect(screen.getAllByText('No').length).toBeGreaterThanOrEqual(1)
  })

  it('renders estimated minutes', () => {
    renderCard()
    expect(screen.getByText('Est. 10m')).toBeTruthy()
  })

  it('renders difficulty label', () => {
    renderCard()
    expect(screen.getByText('Medium')).toBeTruthy()
  })

  it('renders association count', () => {
    renderCard()
    expect(screen.getByText('2 associations')).toBeTruthy()
  })

  it('renders occurrence count', () => {
    renderCard()
    expect(screen.getByText('45 occurrences')).toBeTruthy()
  })

  it('renders action buttons for current variant', () => {
    renderCard()
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Pause')).toBeTruthy()
    expect(screen.getByText('Archive')).toBeTruthy()
  })

  it('renders Resume button for inactive master', () => {
    renderCard({ master: makeMaster({ id: 'mc-5', status: 'inactive' }) })
    expect(screen.getByText('Resume')).toBeTruthy()
  })

  it('renders Restore button for archived variant', () => {
    const onRestore = vi.fn()
    const { onArchive: _unused, ...restDefaultProps } = defaultProps
    render(
      <MasterChoreCard
        {...restDefaultProps}
        actionVariant="archived"
        onRestore={onRestore}
      />
    )
    expect(screen.getByText('Restore')).toBeTruthy()
  })

  it('calls onToggleSelect when checkbox is clicked', async () => {
    const onToggleSelect = vi.fn()
    renderCard({ onToggleSelect })
    const checkbox = screen.getByRole('checkbox')
    checkbox.click()
    expect(onToggleSelect).toHaveBeenCalledWith('mc-1')
  })

  it('calls onEdit when Edit button is clicked', async () => {
    const onEdit = vi.fn()
    renderCard({ onEdit })
    screen.getByText('Edit').click()
    expect(onEdit).toHaveBeenCalled()
  })

  it('calls onToggleStatus when Pause button is clicked', async () => {
    const onToggleStatus = vi.fn()
    renderCard({ onToggleStatus })
    screen.getByText('Pause').click()
    expect(onToggleStatus).toHaveBeenCalled()
  })

  it('applies opacity-75 class for inactive masters', () => {
    const { container } = renderCard({
      master: makeMaster({ id: 'mc-6', status: 'inactive' }),
    })
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('opacity-75')
  })

  it('does not apply opacity-75 class for active masters', () => {
    const { container } = renderCard()
    const card = container.firstChild as HTMLElement
    expect(card.className).not.toContain('opacity-75')
  })
})
