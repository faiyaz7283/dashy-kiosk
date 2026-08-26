/**
 * Tests for ErrorBoundary component.
 *
 * Verifies that the boundary catches render errors, shows fallback UI,
 * logs errors, and resets on retry.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

/** Component that throws on render. */
function ThrowError({ message = 'Test error' }: { message?: string }): ReactNode {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Child content')).toBeTruthy()
  })

  it('renders fallback UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Test error')).toBeTruthy()
    expect(screen.getByText('Try again')).toBeTruthy()
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('renders custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom fallback')).toBeTruthy()
  })

  it('logs error with component stack', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError message="Specific error" />
      </ErrorBoundary>,
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      'Render error:',
      expect.objectContaining({ message: 'Specific error' }),
      expect.any(String),
    )
  })

  it('shows default message when error has no message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError message="" />
      </ErrorBoundary>,
    )

    expect(screen.getByText('An unexpected error occurred')).toBeTruthy()
  })
})
