/**
 * Tests for the ChoreModal component.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChoreModal } from './ChoreModal'
import type { ChoreCategory, ChoreTag } from '@/types'

// Mock useUiScale
vi.mock('@/features/kiosk/hooks/useUiScale', () => ({
  useUiScale: () => 1,
}))

const mockCategories: ChoreCategory[] = [
  { id: 'cat-1', name: 'Kitchen' },
  { id: 'cat-2', name: 'Bathroom' },
]

const mockTags: ChoreTag[] = [
  { id: 'tag-1', name: 'Quick' },
  { id: 'tag-2', name: 'Heavy' },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  categories: mockCategories,
  tags: mockTags,
  onCreateCategory: vi.fn(),
  onCreateTag: vi.fn(),
  currentMemberId: 'trisha',
}

describe('ChoreModal', () => {
  it('renders nothing when not open', () => {
    render(<ChoreModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('New Chore')).not.toBeInTheDocument()
  })

  it('renders "New Chore" title in create mode', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('New Chore')).toBeInTheDocument()
  })

  it('renders "Edit Chore" title in edit mode', () => {
    render(<ChoreModal {...defaultProps} mode="edit" />)
    expect(screen.getByText('Edit Chore')).toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Difficulty')).toBeInTheDocument()
    expect(screen.getByText('Frequency')).toBeInTheDocument()
    expect(screen.getByText('Estimated Time (minutes)')).toBeInTheDocument()
    expect(screen.getByText('Due Time')).toBeInTheDocument()
    expect(screen.getByText('Due Date')).toBeInTheDocument()
    expect(screen.getByText('When Period Expires')).toBeInTheDocument()
  })

  it('renders category options', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText('Bathroom')).toBeInTheDocument()
  })

  it('renders tag toggles', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('Quick')).toBeInTheDocument()
    expect(screen.getByText('Heavy')).toBeInTheDocument()
  })

  it('renders difficulty buttons 1-5', () => {
    render(<ChoreModal {...defaultProps} />)
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('calls onClose when close button is clicked', () => {
    render(<ChoreModal {...defaultProps} />)
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    render(<ChoreModal {...defaultProps} />)
    const overlay = screen.getByText('New Chore').parentElement?.parentElement
    if (overlay) {
      fireEvent.click(overlay)
      expect(defaultProps.onClose).toHaveBeenCalled()
    }
  })

  it('shows "+ New" button for categories', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('+ New')).toBeInTheDocument()
  })

  it('shows "+ Add Tag" button', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('+ Add Tag')).toBeInTheDocument()
  })

  it('renders "Create Chore" submit button in create mode', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('Create Chore')).toBeInTheDocument()
  })

  it('renders "Save Changes" submit button in edit mode', () => {
    render(<ChoreModal {...defaultProps} mode="edit" />)
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })

  it('renders Cancel button in both modes', () => {
    const { unmount } = render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    unmount()

    render(<ChoreModal {...defaultProps} mode="edit" />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('renders Delete button only in edit mode with onDelete', () => {
    const { unmount } = render(<ChoreModal {...defaultProps} />)
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    unmount()

    render(<ChoreModal {...defaultProps} mode="edit" onDelete={vi.fn()} />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onDelete when Delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<ChoreModal {...defaultProps} mode="edit" onDelete={onDelete} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('pre-fills form data in edit mode', () => {
    render(
      <ChoreModal
        {...defaultProps}
        mode="edit"
        initialData={{
          name: 'Test Chore',
          category_id: 'cat-1',
          tag_ids: ['tag-1'],
          difficulty: 4,
          frequency: 'daily',
          estimated_minutes: 30,
          due_time: '14:00',
          due_date: '2026-08-20',
          expiration_behavior: 'carry_over',
        }}
      />,
    )

    const nameInput = screen.getByDisplayValue('Test Chore')
    expect(nameInput).toBeInTheDocument()
  })
})
