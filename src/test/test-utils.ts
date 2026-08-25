/**
 * Shared test utilities for React Query integration.
 *
 * Provides factory functions and wrapper creators for consistent test setup
 * across all test files that use React Query.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

/**
 * Creates a fresh QueryClient configured for testing.
 *
 * Disables retries to keep tests fast and deterministic.
 * Each test should create its own instance and call `clear()` in afterEach.
 *
 * @returns A new QueryClient with test-appropriate defaults.
 *
 * @example
 * ```ts
 * let queryClient: QueryClient
 *
 * beforeEach(() => {
 *   queryClient = createTestQueryClient()
 * })
 *
 * afterEach(() => {
 *   queryClient.clear()
 * })
 * ```
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

/**
 * Creates a React component wrapper that provides a QueryClient to the test tree.
 *
 * Use this with `renderHook` or `render` options to wrap components in QueryClientProvider.
 *
 * @param client - The QueryClient instance to provide.
 * @returns A React component wrapper function.
 *
 * @example
 * ```ts
 * const queryClient = createTestQueryClient()
 * const wrapper = createQueryClientWrapper(queryClient)
 *
 * renderHook(() => useWeatherData(), { wrapper })
 * ```
 */
export function createQueryClientWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}
