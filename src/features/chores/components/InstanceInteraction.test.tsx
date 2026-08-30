/**
 * Tests for InstanceInteraction component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstanceInteraction } from './InstanceInteraction'
import { NotificationProvider } from '@/shared/context/NotificationContext'
import type { ChoreInstance, MasterChore, ChoreCategory, InstanceStatus } from '@/types/chores'
import type { FamilyMember } from '@/types/family'
import type { PaletteKey } from '@/shared/utils/memberColors'

vi.mock('@/shared/date', async () => {
  const actual = await vi.importActual('@/shared/date')
  return {
    ...actual,
    useConfig: () => ({ timezone: 'America/New_York', isLoading: false, error: null }),
    formatTime: (time: Temporal.PlainTime) => time.toString(),
  }
})

vi.mock('@/shared/date/format', () => ({
  formatDateParts: () => 'Monday, Aug 25',
  formatTime: (time: Temporal.PlainTime) => time.toString(),
}))

const mockCategories: ChoreCategory[] = [
  { id: 'cat-1', name: 'Kitchen' },
  { id: 'cat-2', name: 'Family' },
]

const mockMembers: FamilyMember[] = [
  { key: 'faiyaz', name: 'Faiyaz', color_key: 'blue', color: '#3b82f6', initial: 'F', calendar_id: 'cal1', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
  { key: 'trisha', name: 'Trisha', color_key: 'pink', color: '#ec4899', initial: 'T', calendar_id: 'cal2', email: 'trisha@test.com', date_of_birth: '1990-01-01', relation: 'mother' },
]

const mockColorMap = new Map<string, PaletteKey>([
  ['faiyaz', 'blue'],
  ['trisha', 'pink'],
])

function makeInstance(overrides: Partial<ChoreInstance> & { id: string; status: InstanceStatus }): ChoreInstance {
  return {
    master_chore_id: 'mc-1',
    association_id: 'assoc-1',
    period_start: '2026-08-25T00:00:00Z',
    period_end: '2026-08-26T00:00:00Z',
    member_id: null,
    assigned_by: null,
    started_at: null,
    completed_at: null,
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
    ...overrides,
  }
}

function makeMaster(overrides: Partial<MasterChore> = {}): MasterChore {
  return {
    id: 'mc-1',
    name: 'Test Chore',
    category: { id: 'cat-2', name: 'Family' },
    tags: [],
    difficulty: 3,
    frequency: 'daily',
    frequency_interval: 1,
    day_of_week: null,
    day_of_month: null,
    week_of_month: null,
    month: null,
    estimated_minutes: 20,
    due_time: '21:00',
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
  instance: makeInstance({ id: 'inst-1', status: 'active', member_id: 'faiyaz', assigned_by: 'trisha' }),
  masterChore: makeMaster(),
  categories: mockCategories,
  members: mockMembers,
  colorMap: mockColorMap,
  onClose: vi.fn(),
  onStart: vi.fn(),
  onComplete: vi.fn(),
  onClaim: vi.fn(),
  onAssign: vi.fn(),
  onViewTemplate: vi.fn(),
}

function renderPopup(overrides: Partial<typeof defaultProps> = {}) {
  return render(
    <NotificationProvider>
      <InstanceInteraction {...defaultProps} {...overrides} />
    </NotificationProvider>
  )
}

describe('InstanceInteraction', () => {
  describe('active instance', () => {
    it('renders chore name and status badge', () => {
      renderPopup()
      expect(screen.getByText('Test Chore')).toBeTruthy()
      expect(screen.getByText('Active')).toBeTruthy()
    })

    it('renders category tag', () => {
      renderPopup()
      expect(screen.getByText('Family')).toBeTruthy()
    })

    it('renders recurrence summary', () => {
      renderPopup()
      // formatRecurrence converts UTC time to timezone — 20:00 UTC = 4:00 PM EDT
      expect(screen.getByText(/Daily at/)).toBeTruthy()
    })

    it('renders period date', () => {
      renderPopup()
      expect(screen.getByText('Monday, Aug 25')).toBeTruthy()
    })

    it('renders due time', () => {
      renderPopup()
      expect(screen.getByText(/Due by/)).toBeTruthy()
    })

    it('renders assignment info with member name', () => {
      renderPopup()
      expect(screen.getByText('Faiyaz')).toBeTruthy()
      expect(screen.getByText(/Assigned by Trisha/)).toBeTruthy()
    })

    it('renders estimated time', () => {
      renderPopup()
      expect(screen.getByText('Est. 20m')).toBeTruthy()
    })

    it('renders Start button', () => {
      renderPopup()
      expect(screen.getByText('Start')).toBeTruthy()
    })

    it('renders View Template link', () => {
      renderPopup()
      expect(screen.getByText('View Template')).toBeTruthy()
    })

    it('renders close button', () => {
      renderPopup()
      expect(screen.getByLabelText('Close')).toBeTruthy()
    })
  })

  describe('in-progress instance', () => {
    it('renders In Progress status', () => {
      const instance = makeInstance({
        id: 'inst-2',
        status: 'in_progress',
        member_id: 'faiyaz',
        started_at: '2026-08-25T18:45:00Z',
      })
      renderPopup({ instance })
      expect(screen.getByText('In Progress')).toBeTruthy()
    })

    it('renders Complete button', () => {
      const instance = makeInstance({
        id: 'inst-2',
        status: 'in_progress',
        member_id: 'faiyaz',
      })
      renderPopup({ instance })
      expect(screen.getByText('Complete')).toBeTruthy()
    })

    it('renders started time', () => {
      const instance = makeInstance({
        id: 'inst-2',
        status: 'in_progress',
        member_id: 'faiyaz',
        started_at: '2026-08-25T18:45:00Z',
      })
      renderPopup({ instance })
      expect(screen.getByText(/Started at/)).toBeTruthy()
    })

    it('shows Claimed text for claimed instance', () => {
      const instance = makeInstance({
        id: 'inst-2',
        status: 'in_progress',
        member_id: 'faiyaz',
      })
      renderPopup({ instance })
      expect(screen.getByText(/Claimed/)).toBeTruthy()
    })
  })

  describe('overdue instance', () => {
    it('renders Overdue status', () => {
      const instance = makeInstance({
        id: 'inst-3',
        status: 'overdue',
        member_id: 'faiyaz',
      })
      renderPopup({ instance })
      expect(screen.getByText('Overdue')).toBeTruthy()
    })

    it('renders Complete Now button', () => {
      const instance = makeInstance({
        id: 'inst-3',
        status: 'overdue',
        member_id: 'faiyaz',
      })
      renderPopup({ instance })
      expect(screen.getByText('Complete Now')).toBeTruthy()
    })

    it('renders due time with Late indicator', () => {
      const instance = makeInstance({
        id: 'inst-3',
        status: 'overdue',
        member_id: 'faiyaz',
      })
      renderPopup({ instance })
      expect(screen.getByText(/Due by.*Late/)).toBeTruthy()
    })
  })

  describe('missed instance', () => {
    it('renders Missed status', () => {
      const instance = makeInstance({
        id: 'inst-4',
        status: 'missed',
        member_id: 'trisha',
      })
      renderPopup({ instance })
      expect(screen.getByText('Missed')).toBeTruthy()
    })

    it('renders disabled Cannot Complete button', () => {
      const instance = makeInstance({
        id: 'inst-4',
        status: 'missed',
        member_id: 'trisha',
      })
      renderPopup({ instance })
      const button = screen.getByText('Cannot Complete (Missed)')
      expect(button.closest('button')?.disabled).toBe(true)
    })

    it('renders due time with Period ended indicator', () => {
      const instance = makeInstance({
        id: 'inst-4',
        status: 'missed',
        member_id: 'trisha',
      })
      renderPopup({ instance })
      expect(screen.getByText(/Due by.*Period ended/)).toBeTruthy()
    })

    it('applies opacity-75 class', () => {
      const instance = makeInstance({
        id: 'inst-4',
        status: 'missed',
        member_id: 'trisha',
      })
      const { container } = renderPopup({ instance })
      const popup = container.querySelector('.opacity-75')
      expect(popup).toBeTruthy()
    })
  })

  describe('open pool instance', () => {
    it('renders Open Pool text instead of member', () => {
      const instance = makeInstance({
        id: 'inst-5',
        status: 'active',
        member_id: null,
      })
      renderPopup({ instance })
      expect(screen.getByText('Open Pool')).toBeTruthy()
    })

    it('renders Claim by dropdown', () => {
      const instance = makeInstance({
        id: 'inst-5',
        status: 'active',
        member_id: null,
      })
      renderPopup({ instance })
      expect(screen.getByText('Claim by')).toBeTruthy()
    })

    it('renders Assign section with dropdowns', () => {
      const instance = makeInstance({
        id: 'inst-5',
        status: 'active',
        member_id: null,
      })
      renderPopup({ instance })
      expect(screen.getByText('Assign to')).toBeTruthy()
      expect(screen.getByText('Assign by')).toBeTruthy()
    })

    it('does not render Start button for open pool', () => {
      const instance = makeInstance({
        id: 'inst-5',
        status: 'active',
        member_id: null,
      })
      renderPopup({ instance })
      expect(screen.queryByText('Start')).toBeNull()
    })
  })

  describe('without due time', () => {
    it('does not render due time row when master has no due_time', () => {
      const master = makeMaster({ due_time: null })
      renderPopup({ masterChore: master })
      expect(screen.queryByText(/Due by/)).toBeNull()
    })
  })

  describe('without estimated time', () => {
    it('does not render est. time row when master has no estimated_minutes', () => {
      const master = makeMaster({ estimated_minutes: null })
      renderPopup({ masterChore: master })
      expect(screen.queryByText(/Est\./)).toBeNull()
    })
  })
})
