/**
 * Tests for useFamilyData hook.
 *
 * Validates React Query integration, data transformation, and loading states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { useFamilyData } from './useFamilyData'
import type { FamilyMember } from '@/types'
import { createTestQueryClient, createQueryClientWrapper } from '@/test/test-utils'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = createTestQueryClient()
})

afterEach(() => {
  queryClient.clear()
})

const mockFamilyMembers: FamilyMember[] = [
  {
    name: 'Alice',
    key: 'alice',
    calendar_id: 'alice@example.com',
    email: 'alice@example.com',
    color: '#3b82f6',
    color_key: 'blue',
    initial: 'A',
    date_of_birth: null,
    relation: null,
  },
  {
    name: 'Bob',
    key: 'bob',
    calendar_id: 'bob@example.com',
    email: 'bob@example.com',
    color: '#22c55e',
    color_key: 'green',
    initial: 'B',
    date_of_birth: null,
    relation: null,
  },
]

describe('useFamilyData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in loading state', () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(
      () => new Promise(() => {}), // Never resolves
    )

    const { result } = renderHook(() => useFamilyData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.members).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns family members after successful fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFamilyMembers),
    } as Response)

    const { result } = renderHook(() => useFamilyData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.members).toEqual(mockFamilyMembers)
    expect(result.current.error).toBeNull()
  })

  it('returns empty array when no members exist', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    const { result } = renderHook(() => useFamilyData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.members).toEqual([])
  })

  it('returns error message on fetch failure', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ detail: 'Access denied' }),
    } as Response)

    const { result } = renderHook(() => useFamilyData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.members).toEqual([])
    expect(result.current.error).toBe('Access denied')
  })

  it('uses statusText when error body has no detail', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('No JSON')),
    } as Response)

    const { result } = renderHook(() => useFamilyData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Internal Server Error')
  })
})
