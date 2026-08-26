/**
 * Tests for SegmentedControl component.
 *
 * Validates segmented control renders options and handles selection.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SegmentedControl } from './SegmentedControl'

const options = [
  { value: 'open', label: 'Open' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'assigned', label: 'Assigned' },
]

describe('SegmentedControl', () => {
  it('renders all options', () => {
    render(
      <SegmentedControl
        label="Assignment"
        options={options}
        value="open"
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Claimed')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
  })

  it('marks selected option with aria-checked', () => {
    render(
      <SegmentedControl
        label="Assignment"
        options={options}
        value="claimed"
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Claimed')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Open')).toHaveAttribute('aria-checked', 'false')
  })

  it('renders label when provided', () => {
    render(
      <SegmentedControl
        label="Assignment Type"
        options={options}
        value="open"
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Assignment Type')).toBeInTheDocument()
  })

  it('renders without label', () => {
    const { container } = render(
      <SegmentedControl
        options={options}
        value="open"
        onChange={vi.fn()}
      />
    )
    expect(container.querySelector('label')).toBeNull()
  })

  it('has radiogroup role', () => {
    render(
      <SegmentedControl
        label="Assignment"
        options={options}
        value="open"
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
})
