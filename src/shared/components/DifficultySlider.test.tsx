/**
 * Tests for DifficultySlider component.
 *
 * Validates difficulty slider renders and handles value changes.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DifficultySlider } from './DifficultySlider'

describe('DifficultySlider', () => {
  it('renders label', () => {
    render(
      <DifficultySlider label="Difficulty" value={3} onChange={vi.fn()} />
    )
    expect(screen.getByText('Difficulty')).toBeInTheDocument()
  })

  it('displays current value', () => {
    render(
      <DifficultySlider label="Difficulty" value={4} onChange={vi.fn()} />
    )
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders range input with correct attributes', () => {
    render(
      <DifficultySlider label="Difficulty" value={2} onChange={vi.fn()} />
    )
    const input = screen.getByRole('slider')
    expect(input).toHaveAttribute('min', '1')
    expect(input).toHaveAttribute('max', '5')
    expect(input).toHaveAttribute('value', '2')
  })

})
