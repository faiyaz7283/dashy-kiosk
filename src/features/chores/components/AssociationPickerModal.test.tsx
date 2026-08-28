/**
 * Tests for AssociationPickerModal component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AssociationPickerModal } from './AssociationPickerModal'
import { NotificationProvider } from '@/shared/context/NotificationContext'
import type {
  MasterChore,
  ChoreAssociation,
  ChoreCategory,
} from '@/types/chores'
import type { FamilyMember } from '@/types/family'

vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
  }
})

const mockCreateAssociation = vi.fn().mockResolvedValue({})

vi.mock('../hooks/useChoreActions', () => ({
  useChoreActions: () => ({
    createAssociation: mockCreateAssociation,
  }),
}))

const mockCategories: ChoreCategory[] = [
  { id: 'cat-1', name: 'Kitchen' },
  { id: 'cat-2', name: 'Cleaning' },
]

const mockMembers: FamilyMember[] = [
  { key: 'faiyaz', name: 'Faiyaz', color_key: 'blue', color: '#3b82f6', initial: 'F', calendar_id: 'cal1', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
  { key: 'trisha', name: 'Trisha', color_key: 'pink', color: '#ec4899', initial: 'T', calendar_id: 'cal2', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
]

function makeMaster(overrides: Partial<MasterChore> & { id: string }): MasterChore {
  return {
    name: 'Test Chore',
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
    ...overrides,
  }
}

const mockMasters: MasterChore[] = [
  makeMaster({ id: 'mc-1', name: 'Wipe Counter' }),
  makeMaster({ id: 'mc-2', name: 'Cook Dinner', category: { id: 'cat-1', name: 'Kitchen' } }),
  makeMaster({
    id: 'mc-3',
    name: 'Deep Clean Oven',
    recurrence_rule: null,
    estimated_minutes: 60,
    difficulty: 5,
  }),
]

const mockAssociations: ChoreAssociation[] = []

const defaultProps = {
  targetMember: mockMembers[0] as FamilyMember | null,
  masterChores: mockMasters,
  categories: mockCategories,
  associations: mockAssociations,
  members: mockMembers,
  onClose: vi.fn(),
  onAssociationCreated: vi.fn(),
}

function renderModal(overrides: Partial<typeof defaultProps> = {}) {
  return render(
    <NotificationProvider>
      <AssociationPickerModal {...defaultProps} {...overrides} />
    </NotificationProvider>,
  )
}

describe('AssociationPickerModal', () => {
  it('renders the modal title with member name', () => {
    renderModal()
    expect(screen.getByText('Assign Chores to Faiyaz')).toBeTruthy()
  })

  it('renders open pool title when target is null', () => {
    renderModal({ targetMember: null })
    expect(screen.getByText('Add to Open Pool')).toBeTruthy()
  })

  it('renders member avatar with initial', () => {
    renderModal()
    expect(screen.getByText('F')).toBeTruthy()
  })

  it('renders all available master chores', () => {
    renderModal()
    expect(screen.getByText('Wipe Counter')).toBeTruthy()
    expect(screen.getByText('Cook Dinner')).toBeTruthy()
    expect(screen.getByText('Deep Clean Oven')).toBeTruthy()
  })

  it('shows correct available count', () => {
    renderModal()
    expect(screen.getByText('3 available')).toBeTruthy()
  })

  it('filters out masters already associated to the target member', () => {
    const associations: ChoreAssociation[] = [
      {
        id: 'a-1',
        master_chore_id: 'mc-1',
        member_id: 'faiyaz',
        is_open_pool: false,
        created_by: 'trisha',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        removed_at: null,
      },
    ]
    renderModal({ associations })
    expect(screen.queryByText('Wipe Counter')).toBeNull()
    expect(screen.getByText('Cook Dinner')).toBeTruthy()
    expect(screen.getByText('2 available')).toBeTruthy()
  })

  it('filters out non-collaborative masters that have any member association', () => {
    const associations: ChoreAssociation[] = [
      {
        id: 'a-1',
        master_chore_id: 'mc-1',
        member_id: 'trisha',
        is_open_pool: false,
        created_by: 'faiyaz',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        removed_at: null,
      },
    ]
    renderModal({ associations })
    // mc-1 is non-collaborative and has a member association, so it should be hidden
    expect(screen.queryByText('Wipe Counter')).toBeNull()
    expect(screen.getByText('Cook Dinner')).toBeTruthy()
    expect(screen.getByText('2 available')).toBeTruthy()
  })

  it('shows section headers in "all" group mode', () => {
    renderModal()
    // "Recurring" appears in section header + group toggle button
    expect(screen.getAllByText('Recurring').length).toBeGreaterThanOrEqual(1)
    // "One-off" appears in section header + group toggle button
    expect(screen.getAllByText('One-off').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Claim buttons for each item', () => {
    renderModal()
    const claimButtons = screen.getAllByText('Claim')
    expect(claimButtons.length).toBe(3)
  })

  it('shows empty state when no masters available', () => {
    renderModal({ masterChores: [] })
    expect(screen.getByText('No chores available')).toBeTruthy()
  })

  it('shows "One-time" badge for one-off chores', () => {
    renderModal()
    expect(screen.getByText('One-time')).toBeTruthy()
  })

  it('shows difficulty label', () => {
    renderModal()
    // "Medium" appears for mc-1 and mc-2 (both difficulty 3)
    expect(screen.getAllByText('Medium').length).toBe(2)
    expect(screen.getByText('Very Hard')).toBeTruthy()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const closeButton = screen.getByRole('button', { name: /close/i })
    closeButton.click()
    expect(onClose).toHaveBeenCalled()
  })
})
