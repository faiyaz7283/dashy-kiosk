/**
 * Tests for React Query client configuration.
 *
 * Validates QueryClient exports and default options.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('exports a QueryClient instance', () => {
    expect(queryClient).toBeDefined()
    expect(queryClient.getDefaultOptions).toBeDefined()
  })

  it('has 30s default stale time', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(30_000)
  })

  it('refetches on window focus by default', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true)
  })

  it('retries failed queries twice by default', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.retry).toBe(2)
  })

  it('uses exponential backoff for retry delay', () => {
    const defaults = queryClient.getDefaultOptions()
    const retryDelay = defaults.queries?.retryDelay
    expect(retryDelay).toBeDefined()

    if (typeof retryDelay === 'function') {
      // retryDelay signature: (attempt: number, error: unknown) => number
      const mockError = new Error('test')
      expect(retryDelay(0, mockError)).toBe(1000)
      expect(retryDelay(1, mockError)).toBe(2000)
      expect(retryDelay(2, mockError)).toBe(4000)
      expect(retryDelay(10, mockError)).toBe(30_000) // Capped at max
    }
  })
})

describe('QueryClientProvider integration', () => {
  it('wraps app without errors', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <div>Test App</div>
      </QueryClientProvider>,
    )

    expect(container.textContent).toBe('Test App')
  })
})
