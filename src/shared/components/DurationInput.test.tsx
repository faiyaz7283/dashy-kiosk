/**
 * Tests for DurationInput component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DurationInput } from './DurationInput'

const defaultProps = {
  label: 'Estimated Duration',
  value: '10',
  onValueChange: vi.fn(),
  unit: 'minutes' as const,
  onUnitChange: vi.fn(),
}

function renderInput(overrides: Partial<typeof defaultProps> = {}) {
  return render(<DurationInput {...defaultProps} {...overrides} />)
}

describe('DurationInput', () => {
  it('renders label', () => {
    renderInput()
    expect(screen.getByText('Estimated Duration')).toBeTruthy()
  })

  it('renders numeric input with value', () => {
    renderInput()
    const input = screen.getByDisplayValue('10')
    expect(input).toBeTruthy()
    expect(input.tagName).toBe('INPUT')
  })

  it('renders unit dropdown with minutes selected', () => {
    renderInput()
    const select = screen.getByLabelText('Duration unit')
    expect((select as HTMLSelectElement).value).toBe('minutes')
  })

  it('renders all unit options', () => {
    renderInput()
    expect(screen.getByText('min')).toBeTruthy()
    expect(screen.getByText('hr')).toBeTruthy()
    expect(screen.getByText('day')).toBeTruthy()
  })

  it('renders placeholder when value is empty', () => {
    renderInput({ value: '' })
    const input = screen.getByPlaceholderText('0')
    expect(input).toBeTruthy()
  })
})
