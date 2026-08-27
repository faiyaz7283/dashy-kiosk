/**
 * Tests for DifficultyDots component.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DifficultyDots } from './DifficultyDots'

describe('DifficultyDots', () => {
  it('renders 5 dots', () => {
    const { container } = render(<DifficultyDots level={3} />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBe(5)
  })

  it('fills correct number of dots for level 3', () => {
    const { container } = render(<DifficultyDots level={3} />)
    const filled = container.querySelectorAll('.bg-chores-in-progress')
    const empty = container.querySelectorAll('.bg-border')
    expect(filled.length).toBe(3)
    expect(empty.length).toBe(2)
  })

  it('fills all dots for level 5', () => {
    const { container } = render(<DifficultyDots level={5} />)
    const filled = container.querySelectorAll('.bg-chores-in-progress')
    expect(filled.length).toBe(5)
  })

  it('fills no dots for level 0', () => {
    const { container } = render(<DifficultyDots level={0} />)
    const filled = container.querySelectorAll('.bg-chores-in-progress')
    expect(filled.length).toBe(0)
  })

  it('uses sm size class by default', () => {
    const { container } = render(<DifficultyDots level={3} />)
    const firstDot = container.querySelector('.rounded-full')
    expect(firstDot?.className).toContain('h-1')
    expect(firstDot?.className).toContain('w-1')
  })

  it('uses md size class when specified', () => {
    const { container } = render(<DifficultyDots level={3} size="md" />)
    const firstDot = container.querySelector('.rounded-full')
    expect(firstDot?.className).toContain('h-1.5')
    expect(firstDot?.className).toContain('w-1.5')
  })
})
