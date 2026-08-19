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

  it('renders modal title when open', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('New Chore')).toBeInTheDocument()
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
    const closeButton = screen.getByRole('button', { name: '' })
    // The X button (close)
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

  it('renders submit button', () => {
    render(<ChoreModal {...defaultProps} />)
    expect(screen.getByText('Create Chore')).toBeInTheDocument()
  })
})
