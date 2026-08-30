/**
 * Tests for MasterChoreModal component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MasterChoreModal } from './MasterChoreModal'
import { NotificationProvider } from '@/shared/context/NotificationContext'
import type {
  MasterChore,
  ChoreCategory,
  ChoreTag,
} from '@/types/chores'
import type { FamilyMember } from '@/types/family'

vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
  }
})

vi.mock('../hooks/useChoreActions', () => ({
  useChoreActions: () => ({
    createMaster: vi.fn(),
    updateMaster: vi.fn(),
  }),
}))

const mockCategories: ChoreCategory[] = [
  { id: 'cat-1', name: 'Kitchen' },
  { id: 'cat-2', name: 'Cleaning' },
]

const mockTags: ChoreTag[] = [
  { id: 'tag-1', name: 'Quick' },
  { id: 'tag-2', name: 'Evening' },
]

const mockMembers: FamilyMember[] = [
  { key: 'faiyaz', name: 'Faiyaz', color_key: 'blue', color: '#3b82f6', initial: 'F', calendar_id: 'cal1', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
]

function makeMaster(overrides: Partial<MasterChore> & { id: string }): MasterChore {
  return {
    name: 'Test Chore',
    category: { id: 'cat-1', name: 'Kitchen' },
    tags: [{ id: 'tag-1', name: 'Quick' }],
    difficulty: 3,
    frequency: 'weekly',
    frequency_interval: 1,
    day_of_week: [0],
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
    ...overrides,
  }
}

const defaultProps = {
  mode: 'create' as const,
  categories: mockCategories,
  tags: mockTags,
  members: mockMembers,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  refetch: vi.fn(),
}

type ModalOverrides = {
  mode?: 'create' | 'edit'
  master?: MasterChore
  categories?: ChoreCategory[]
  tags?: ChoreTag[]
  members?: FamilyMember[]
  onClose?: () => void
  onSuccess?: () => void
  refetch?: () => void
}

function renderModal(overrides: ModalOverrides = {}) {
  return render(
    <NotificationProvider>
      <MasterChoreModal {...defaultProps} {...overrides} />
    </NotificationProvider>
  )
}

describe('MasterChoreModal', () => {
  describe('create mode', () => {
    it('renders "New Chore Template" title', () => {
      renderModal()
      expect(screen.getByText('New Chore Template')).toBeTruthy()
    })

    it('renders "Create Template" submit button', () => {
      renderModal()
      expect(screen.getByText('Create Template')).toBeTruthy()
    })

    it('renders Name input', () => {
      renderModal()
      expect(screen.getByPlaceholderText('e.g., Wipe Counter')).toBeTruthy()
    })

    it('renders Category combobox', () => {
      renderModal()
      expect(screen.getByText('Category')).toBeTruthy()
    })

    it('renders Tags input', () => {
      renderModal()
      expect(screen.getByText('Tags')).toBeTruthy()
    })

    it('renders Difficulty slider', () => {
      renderModal()
      expect(screen.getByText('Difficulty')).toBeTruthy()
    })

    it('renders difficulty label "Medium" for default value 3', () => {
      renderModal()
      expect(screen.getByText('Medium')).toBeTruthy()
    })

    it('renders Recurrence Pattern section', () => {
      renderModal()
      expect(screen.getByText('Recurrence Pattern')).toBeTruthy()
    })

    it('renders frequency select with default "Weekly"', () => {
      renderModal()
      expect(screen.getByText('Frequency')).toBeTruthy()
    })

    it('renders day-of-week buttons for weekly frequency', () => {
      renderModal()
      expect(screen.getByText('Mon')).toBeTruthy()
      expect(screen.getByText('Tue')).toBeTruthy()
      expect(screen.getByText('Sun')).toBeTruthy()
    })

    it('renders Estimated Duration input', () => {
      renderModal()
      expect(screen.getByText('Estimated Duration')).toBeTruthy()
    })

    it('renders End Date and Max Occurrences inputs', () => {
      renderModal()
      expect(screen.getByText('End Date')).toBeTruthy()
      expect(screen.getByText('Max Occurrences')).toBeTruthy()
    })

    it('renders Collaborative toggle', () => {
      renderModal()
      expect(screen.getByText('Collaborative')).toBeTruthy()
      const switches = screen.getAllByRole('switch')
      expect(switches.length).toBeGreaterThanOrEqual(1)
    })

    it('renders Conditions "Coming soon"', () => {
      renderModal()
      expect(screen.getByText('Conditions')).toBeTruthy()
      expect(screen.getByText('Coming soon')).toBeTruthy()
    })

    it('renders Cancel button', () => {
      renderModal()
      expect(screen.getByText('Cancel')).toBeTruthy()
    })

    it('has submit button disabled when name is empty', () => {
      renderModal()
      const submitBtn = screen.getByText('Create Template')
      expect(submitBtn.closest('button')?.disabled).toBe(true)
    })
  })

  describe('edit mode', () => {
    it('renders "Edit Chore Template" title', () => {
      renderModal({ mode: 'edit', master: makeMaster({ id: 'mc-1' }) })
      expect(screen.getByText('Edit Chore Template')).toBeTruthy()
    })

    it('renders "Save Changes" submit button', () => {
      renderModal({ mode: 'edit', master: makeMaster({ id: 'mc-1' }) })
      expect(screen.getByText('Save Changes')).toBeTruthy()
    })

    it('pre-populates name from master', () => {
      renderModal({ mode: 'edit', master: makeMaster({ id: 'mc-1', name: 'Wipe Counter' }) })
      const nameInput = screen.getByDisplayValue('Wipe Counter')
      expect(nameInput).toBeTruthy()
    })

    it('pre-populates estimated duration from master', () => {
      renderModal({ mode: 'edit', master: makeMaster({ id: 'mc-1', estimated_minutes: 30 }) })
      const estInput = screen.getByDisplayValue('30')
      expect(estInput).toBeTruthy()
    })
  })

  describe('conditional recurrence fields', () => {
    it('shows due_time field for weekly frequency', () => {
      const master = makeMaster({
        id: 'mc-weekly',
        due_time: '18:00',
      })
      renderModal({ mode: 'edit', master })
      // Both the recurrence time and due_time fields show '18:00'
      expect(screen.getAllByDisplayValue('18:00').length).toBeGreaterThanOrEqual(1)
    })

    it('shows frequency section for "once" frequency', () => {
      const master = makeMaster({
        id: 'mc-once',
        frequency: 'once',
      })
      renderModal({ mode: 'edit', master })
      expect(screen.getByText('Frequency')).toBeTruthy()
    })

    it('shows monthly pattern fields for monthly frequency', () => {
      const master = makeMaster({
        id: 'mc-monthly',
        frequency: 'monthly',
        day_of_month: 15,
      })
      renderModal({ mode: 'edit', master })
      expect(screen.getByText('Monthly Pattern')).toBeTruthy()
      expect(screen.getByText('On a specific day')).toBeTruthy()
      expect(screen.getByText('On the Nth weekday')).toBeTruthy()
    })

    it('shows yearly pattern fields for yearly frequency', () => {
      const master = makeMaster({
        id: 'mc-yearly',
        frequency: 'yearly',
        month: 6,
        day_of_month: 15,
      })
      renderModal({ mode: 'edit', master })
      expect(screen.getByText('Yearly Pattern')).toBeTruthy()
      expect(screen.getByText('Month')).toBeTruthy()
    })
  })

  describe('due time and date fields', () => {
    it('shows Due Time for weekly frequency', () => {
      renderModal()
      // Default frequency is weekly — Due Time should be visible
      expect(screen.getByText('Due Time')).toBeTruthy()
    })

    it('shows Due Time for once frequency', () => {
      const master = makeMaster({
        id: 'mc-once',
        frequency: 'once',
      })
      renderModal({ mode: 'edit', master })
      expect(screen.getByText('Due Time')).toBeTruthy()
    })

    it('shows Due Date only for once frequency', () => {
      const master = makeMaster({
        id: 'mc-once',
        frequency: 'once',
        due_date: '2026-09-01',
      })
      renderModal({ mode: 'edit', master })
      expect(screen.getByText('Due Date')).toBeTruthy()
    })

    it('hides Due Date for weekly frequency', () => {
      renderModal()
      // Default frequency is weekly — Due Date should not be visible
      expect(screen.queryByText('Due Date')).toBeNull()
    })

    it('pre-populates due_time from master', () => {
      const master = makeMaster({
        id: 'mc-1',
        due_time: '21:00',
      })
      renderModal({ mode: 'edit', master })
      // Both the recurrence time and due_time fields show '21:00'
      expect(screen.getAllByDisplayValue('21:00').length).toBeGreaterThanOrEqual(1)
    })

    it('pre-populates due_date from master for once frequency', () => {
      const master = makeMaster({
        id: 'mc-once',
        frequency: 'once',
        due_date: '2026-09-01',
      })
      renderModal({ mode: 'edit', master })
      expect(screen.getByDisplayValue('2026-09-01')).toBeTruthy()
    })
  })
})
