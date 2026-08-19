/**
 * useChoreActions — mutation hook for chore operations.
 *
 * Provides functions for creating master chores, claiming/assigning
 * instances, updating statuses, creating categories/tags, and approving
 * masters. Each function calls the API and then triggers a refetch.
 */

import { useCallback } from 'react'
import {
  createMasterChore,
  updateMasterChore as apiUpdateMasterChore,
  deleteMasterChore as apiDeleteMasterChore,
  claimInstance as apiClaimInstance,
  assignInstance as apiAssignInstance,
  updateInstanceStatus as apiUpdateInstanceStatus,
  createCategory as apiCreateCategory,
  createTag as apiCreateTag,
  approveMasterChore as apiApproveMasterChore,
} from '@/shared/services/api'
import type { InstanceStatus } from '@/types'
import type { ChoreFormData } from '@/features/chores/components/ChoreModal'

/** Return type of the useChoreActions hook. */
export interface UseChoreActionsReturn {
  /** Create a new master chore template. */
  createMaster: (data: ChoreFormData) => Promise<void>
  /** Update an existing master chore template. */
  updateMaster: (choreId: string, data: ChoreFormData) => Promise<void>
  /** Delete a master chore template. */
  deleteMaster: (choreId: string) => Promise<void>
  /** Claim an open pool instance for a member. */
  claimInstance: (instanceId: string, memberId: string) => Promise<void>
  /** Assign an instance to a member. */
  assignInstance: (instanceId: string, assigneeId: string, assignerId: string) => Promise<void>
  /** Update the status of an instance. */
  updateStatus: (instanceId: string, status: InstanceStatus, actorId: string) => Promise<void>
  /** Create a new category. */
  createCategory: (name: string) => Promise<void>
  /** Create a new tag. */
  createTag: (name: string) => Promise<void>
  /** Approve a pending master chore. */
  approveMaster: (choreId: string, approverId: string) => Promise<void>
}

/**
 * Provides mutation functions for chore operations.
 *
 * Each function performs the API call and then triggers a refetch
 * to update the data.
 *
 * @param refetch - Function to refetch chores data after mutations.
 * @returns Mutation functions.
 */
export function useChoreActions(refetch: () => void): UseChoreActionsReturn {
  const createMaster = useCallback(
    async (data: ChoreFormData) => {
      await createMasterChore(data as unknown as Record<string, unknown>)
      refetch()
    },
    [refetch],
  )

  const updateMaster = useCallback(
    async (choreId: string, data: ChoreFormData) => {
      await apiUpdateMasterChore(choreId, data as unknown as Record<string, unknown>)
      refetch()
    },
    [refetch],
  )

  const deleteMaster = useCallback(
    async (choreId: string) => {
      await apiDeleteMasterChore(choreId)
      refetch()
    },
    [refetch],
  )

  const claimInstance = useCallback(
    async (instanceId: string, memberId: string) => {
      await apiClaimInstance(instanceId, memberId)
      refetch()
    },
    [refetch],
  )

  const assignInstance = useCallback(
    async (instanceId: string, assigneeId: string, assignerId: string) => {
      await apiAssignInstance(instanceId, assigneeId, assignerId)
      refetch()
    },
    [refetch],
  )

  const updateStatus = useCallback(
    async (instanceId: string, status: InstanceStatus, actorId: string) => {
      await apiUpdateInstanceStatus(instanceId, status, actorId)
      refetch()
    },
    [refetch],
  )

  const createCategory = useCallback(
    async (name: string) => {
      await apiCreateCategory(name)
      refetch()
    },
    [refetch],
  )

  const createTag = useCallback(
    async (name: string) => {
      await apiCreateTag(name)
      refetch()
    },
    [refetch],
  )

  const approveMaster = useCallback(
    async (choreId: string, approverId: string) => {
      await apiApproveMasterChore(choreId, approverId)
      refetch()
    },
    [refetch],
  )

  return {
    createMaster,
    updateMaster,
    deleteMaster,
    claimInstance,
    assignInstance,
    updateStatus,
    createCategory,
    createTag,
    approveMaster,
  }
}
