/**
 * Tests for HeaderChores component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeaderChores } from './HeaderChores'
import type { ChoresViewMode } from './HeaderChores'

const defaultProps = {
  viewMode: 'board' as ChoresViewMode,
  onViewChange: vi.fn(),
  selectedCount: 0,
  selectableCount: 0,
  allSelected: false,
  onSelectAll: vi.fn(),
  onPauseSelected: vi.fn(),
  onArchiveSelected: vi.fn(),
  onRestoreSelected: vi.fn(),
  onDeleteSelected: vi.fn(),
  onCreateMaster: vi.fn(),
}

function renderHeader(overrides: Partial<typeof defaultProps> = {}) {
  return render(<HeaderChores {...defaultProps} {...overrides} />)
}

describe('HeaderChores', () => {
  describe('view toggle', () => {
    it('renders all three view options', () => {
      renderHeader()
      expect(screen.getByText('Board')).toBeTruthy()
      expect(screen.getByText('Manage Current')).toBeTruthy()
      expect(screen.getByText('Manage Archived')).toBeTruthy()
    })

    it('highlights the active view', () => {
      renderHeader({ viewMode: 'manage-current' })
      const manageCurrentBtn = screen.getByText('Manage Current')
      expect(manageCurrentBtn.className).toContain('text-primary')
      expect(manageCurrentBtn.className).toContain('bg-white')
    })

    it('does not highlight inactive views', () => {
      renderHeader({ viewMode: 'board' })
      const manageCurrentBtn = screen.getByText('Manage Current')
      expect(manageCurrentBtn.className).toContain('text-text-muted')
    })
  })

  describe('board view', () => {
    it('does not render Select All button', () => {
      renderHeader({ viewMode: 'board' })
      expect(screen.queryByText('Select All')).toBeNull()
    })

    it('does not render bulk action buttons', () => {
      renderHeader({ viewMode: 'board' })
      expect(screen.queryByText('Pause Selected')).toBeNull()
      expect(screen.queryByText('Archive Selected')).toBeNull()
      expect(screen.queryByText('Restore Selected')).toBeNull()
      expect(screen.queryByText('Delete Permanently')).toBeNull()
    })

    it('renders Create Master button', () => {
      renderHeader({ viewMode: 'board' })
      expect(screen.getByText('Create Master')).toBeTruthy()
    })
  })

  describe('manage-current view', () => {
    it('renders Select All button', () => {
      renderHeader({ viewMode: 'manage-current' })
      expect(screen.getByText('Select All')).toBeTruthy()
    })

    it('renders Pause Selected button', () => {
      renderHeader({ viewMode: 'manage-current' })
      expect(screen.getByText('Pause Selected')).toBeTruthy()
    })

    it('renders Archive Selected button', () => {
      renderHeader({ viewMode: 'manage-current' })
      expect(screen.getByText('Archive Selected')).toBeTruthy()
    })

    it('does not render Restore Selected button', () => {
      renderHeader({ viewMode: 'manage-current' })
      expect(screen.queryByText('Restore Selected')).toBeNull()
    })

    it('does not render Delete Permanently button', () => {
      renderHeader({ viewMode: 'manage-current' })
      expect(screen.queryByText('Delete Permanently')).toBeNull()
    })

    it('disables bulk actions when no selection', () => {
      renderHeader({ viewMode: 'manage-current', selectedCount: 0 })
      const pauseBtn = screen.getByText('Pause Selected').closest('button')
      const archiveBtn = screen.getByText('Archive Selected').closest('button')
      expect(pauseBtn?.disabled).toBe(true)
      expect(archiveBtn?.disabled).toBe(true)
    })

    it('enables bulk actions when selection exists', () => {
      renderHeader({ viewMode: 'manage-current', selectedCount: 2 })
      const pauseBtn = screen.getByText('Pause Selected').closest('button')
      const archiveBtn = screen.getByText('Archive Selected').closest('button')
      expect(pauseBtn?.disabled).toBe(false)
      expect(archiveBtn?.disabled).toBe(false)
    })
  })

  describe('manage-archived view', () => {
    it('renders Select All button', () => {
      renderHeader({ viewMode: 'manage-archived' })
      expect(screen.getByText('Select All')).toBeTruthy()
    })

    it('renders Restore Selected button', () => {
      renderHeader({ viewMode: 'manage-archived' })
      expect(screen.getByText('Restore Selected')).toBeTruthy()
    })

    it('renders Delete Permanently button', () => {
      renderHeader({ viewMode: 'manage-archived' })
      expect(screen.getByText('Delete Permanently')).toBeTruthy()
    })

    it('does not render Pause Selected button', () => {
      renderHeader({ viewMode: 'manage-archived' })
      expect(screen.queryByText('Pause Selected')).toBeNull()
    })

    it('does not render Archive Selected button', () => {
      renderHeader({ viewMode: 'manage-archived' })
      expect(screen.queryByText('Archive Selected')).toBeNull()
    })

    it('disables bulk actions when no selection', () => {
      renderHeader({ viewMode: 'manage-archived', selectedCount: 0 })
      const restoreBtn = screen.getByText('Restore Selected').closest('button')
      const deleteBtn = screen.getByText('Delete Permanently').closest('button')
      expect(restoreBtn?.disabled).toBe(true)
      expect(deleteBtn?.disabled).toBe(true)
    })

    it('enables bulk actions when selection exists', () => {
      renderHeader({ viewMode: 'manage-archived', selectedCount: 3 })
      const restoreBtn = screen.getByText('Restore Selected').closest('button')
      const deleteBtn = screen.getByText('Delete Permanently').closest('button')
      expect(restoreBtn?.disabled).toBe(false)
      expect(deleteBtn?.disabled).toBe(false)
    })
  })

  describe('Create Master button', () => {
    it('is visible in board view', () => {
      renderHeader({ viewMode: 'board' })
      expect(screen.getByText('Create Master')).toBeTruthy()
    })

    it('is visible in manage-current view', () => {
      renderHeader({ viewMode: 'manage-current' })
      expect(screen.getByText('Create Master')).toBeTruthy()
    })

    it('is visible in manage-archived view', () => {
      renderHeader({ viewMode: 'manage-archived' })
      expect(screen.getByText('Create Master')).toBeTruthy()
    })
  })
})
