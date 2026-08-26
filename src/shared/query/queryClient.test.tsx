/**
 * Tests for React Query client configuration.
 *
 * Validates QueryClient exports and default options.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { createTestQueryClient } from '@/test/test-utils'
import { ApiError } from '@/shared/errors'

let testQueryClient: ReturnType<typeof createTestQueryClient>

beforeEach(() => {
  testQueryClient = createTestQueryClient()
})

afterEach(() => {
  testQueryClient.clear()
})

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

  it('retries failed queries with smart retry logic', () => {
    const defaults = queryClient.getDefaultOptions()
    const retry = defaults.queries?.retry
    expect(typeof retry).toBe('function')

    if (typeof retry === 'function') {
      // Retries retryable errors (5xx, 429, network)
      const serverError = new ApiError('Server error', 500)
      expect(retry(0, serverError)).toBe(true)
      expect(retry(1, serverError)).toBe(true)
      expect(retry(2, serverError)).toBe(false) // Max retries reached

      const networkError = new ApiError('Network error', 0)
      expect(retry(0, networkError)).toBe(true)

      // Does not retry non-retryable errors (4xx)
      const notFoundError = new ApiError('Not found', 404)
      expect(retry(0, notFoundError)).toBe(false)

      const validationError = new ApiError('Bad request', 400)
      expect(retry(0, validationError)).toBe(false)
    }
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
      <QueryClientProvider client={testQueryClient}>
        <div>Test App</div>
      </QueryClientProvider>,
    )

    expect(container.textContent).toBe('Test App')
  })
})
