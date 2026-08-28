/**
 * Tests for ConfirmDialog component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'

const defaultProps: ConfirmDialogProps = {
  open: true,
  title: 'Test Action',
  message: 'Are you sure you want to do this?',
  confirmLabel: 'Confirm',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

function renderDialog(overrides: Partial<ConfirmDialogProps> = {}) {
  return render(<ConfirmDialog {...defaultProps} {...overrides} />)
}

describe('ConfirmDialog', () => {
  describe('default variant', () => {
    it('renders title and message', () => {
      renderDialog()
      expect(screen.getByText('Test Action')).toBeTruthy()
      expect(screen.getByText('Are you sure you want to do this?')).toBeTruthy()
    })

    it('renders confirm and cancel buttons', () => {
      renderDialog()
      expect(screen.getByText('Confirm')).toBeTruthy()
      expect(screen.getByText('Cancel')).toBeTruthy()
    })

    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn()
      renderDialog({ onConfirm })
      fireEvent.click(screen.getByText('Confirm'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn()
      renderDialog({ onCancel })
      fireEvent.click(screen.getByText('Cancel'))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('uses custom cancel label when provided', () => {
      renderDialog({ cancelLabel: 'Go Back' })
      expect(screen.getByText('Go Back')).toBeTruthy()
    })

    it('shows confirming state when isConfirming is true', () => {
      renderDialog({ isConfirming: true })
      expect(screen.getByText('Confirming...')).toBeTruthy()
      const buttons = screen.getAllByRole('button')
      const confirmBtn = buttons.find((b) => b.textContent === 'Confirming...') as HTMLButtonElement | undefined
      expect(confirmBtn?.disabled).toBe(true)
    })
  })

  describe('danger variant', () => {
    it('renders danger icon', () => {
      renderDialog({ variant: 'danger' })
      // AlertTriangle icon should be present
      const icon = document.querySelector('svg')
      expect(icon).toBeTruthy()
    })

    it('applies danger styling to confirm button', () => {
      renderDialog({ variant: 'danger', confirmLabel: 'Delete' })
      const button = screen.getByText('Delete').closest('button')
      expect(button?.className).toContain('bg-danger')
    })
  })

  describe('closed state', () => {
    it('does not render when open is false', () => {
      renderDialog({ open: false })
      expect(screen.queryByText('Test Action')).toBeNull()
    })
  })
})
