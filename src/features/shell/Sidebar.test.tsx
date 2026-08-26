/**
 * Tests for Sidebar component.
 *
 * Validates sidebar renders navigation items and toggle button.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('renders calendar nav item', () => {
    render(
      <Sidebar
        activeFeature="calendar"
        onFeatureChange={vi.fn()}
        isExpanded={true}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Calendar/i })).toBeInTheDocument()
  })

  it('renders chores nav item', () => {
    render(
      <Sidebar
        activeFeature="calendar"
        onFeatureChange={vi.fn()}
        isExpanded={true}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Chores/i })).toBeInTheDocument()
  })

  it('highlights active feature', () => {
    render(
      <Sidebar
        activeFeature="chores"
        onFeatureChange={vi.fn()}
        isExpanded={true}
        onToggle={vi.fn()}
      />
    )
    const choresButton = screen.getByRole('button', { name: /Chores/i })
    expect(choresButton).toHaveClass('bg-primary-light')
  })

  it('renders toggle button', () => {
    render(
      <Sidebar
        activeFeature="calendar"
        onFeatureChange={vi.fn()}
        isExpanded={true}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByTitle('Collapse sidebar')).toBeInTheDocument()
  })

})
