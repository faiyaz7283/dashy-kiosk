/**
 * Tests for useChoresData hook.
 *
 * Validates React Query integration, data transformation, and loading states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { createTestQueryClient, createQueryClientWrapper } from '@/test/test-utils'
import { useChoresData } from './useChoresData'
import type { ChoresData } from '@/types/chores'

let queryClient: QueryClient

beforeEach(() => {
  queryClient = createTestQueryClient()
})

afterEach(() => {
  queryClient.clear()
})

const mockChoresData: ChoresData = {
  categories: [
    { id: 'cat-1', name: 'Kitchen' },
  ],
  tags: [
    { id: 'tag-1', name: 'Daily' },
  ],
  master_chores: [
    {
      id: 'master-1',
      name: 'Wash dishes',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [{ id: 'tag-1', name: 'Daily' }],
      difficulty: 2,
      frequency: 'daily',
      estimated_minutes: 15,
      due_time: null,
      due_date: null,
      expiration_behavior: 'disappear',
      created_by: 'parent-1',
      approved_by: 'parent-1',
      status: 'active',
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
      deleted_at: null,
    },
  ],
  instances: [
    {
      id: 'inst-1',
      master_chore_id: 'master-1',
      period_start: '2026-08-25T00:00:00Z',
      period_end: '2026-08-26T00:00:00Z',
      status: 'open',
      claimed_by: null,
      assigned_to: 'kid-1',
      assigned_by: 'parent-1',
      completed_by: null,
      signoff_by: null,
      started_at: null,
      completed_at: null,
      signed_off_at: null,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ],
}

describe('useChoresData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in loading state', () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(
      () => new Promise(() => {}), // Never resolves
    )

    const { result } = renderHook(() => useChoresData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns chores data after successful fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockChoresData),
    } as Response)

    const { result } = renderHook(() => useChoresData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockChoresData)
    expect(result.current.error).toBeNull()
  })

  it('returns null data when fetch returns null', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response)

    const { result } = renderHook(() => useChoresData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
  })

  it('returns error message on fetch failure', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ detail: 'Database connection failed' }),
    } as Response)

    const { result } = renderHook(() => useChoresData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Database connection failed')
  })

  it('provides refetch function', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockChoresData),
    } as Response)

    const { result } = renderHook(() => useChoresData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.refetch).toBeDefined()
    expect(typeof result.current.refetch).toBe('function')
  })
})
