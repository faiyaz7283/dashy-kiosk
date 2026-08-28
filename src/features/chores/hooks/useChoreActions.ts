/**
 * Hook for chore mutation actions.
 *
 * Provides typed wrappers around all chores API mutation functions.
 * Each action invalidates the chores query cache after completion to keep data in sync.
 */

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createMasterChore,
  updateMasterChore,
  deleteMasterChore,
  permanentDeleteMasterChore,
  bulkUpdateMasterStatus,
  createAssociation,
  deleteAssociation,
  claimInstance,
  assignInstance,
  updateInstanceStatus,
  deleteInstance,
  revertInstanceStatus,
  resetInstance,
  createCategory,
  createTag,
} from '../api/choresApi'
import { useErrorNotifications } from '@/shared/hooks/useErrorNotifications'
import { ApiError } from '@/shared/errors/ApiError'
import type {
  MasterChore,
  ChoreInstance,
  ChoreCategory,
  ChoreTag,
  InstanceStatus,
  MasterChoreStatus,
  CreateMasterChoreRequest,
  UpdateMasterChoreRequest,
  CreateAssociationRequest,
  AssociationCreateResponse,
} from '@/types/chores'

/** Return type of useChoreActions. */
export interface UseChoreActionsReturn {
  /** Create a new master chore template. */
  createMaster: (data: CreateMasterChoreRequest) => Promise<MasterChore>
  /** Update an existing master chore template. */
  updateMaster: (
    choreId: string,
    data: UpdateMasterChoreRequest,
  ) => Promise<MasterChore>
  /** Soft-delete a master chore template. */
  deleteMaster: (choreId: string) => Promise<void>
  /** Permanently delete a master chore and all related data. */
  permanentDeleteMaster: (choreId: string) => Promise<void>
  /** Bulk update status of multiple master chores. */
  bulkUpdateMasterStatus: (
    masterIds: string[],
    status: MasterChoreStatus,
  ) => Promise<{ updated_count: number }>
  /** Create a new association between a master chore and a member/pool. */
  createAssociation: (data: CreateAssociationRequest) => Promise<AssociationCreateResponse>
  /** Delete (soft-remove) a chore association. */
  deleteAssociation: (associationId: string) => Promise<void>
  /** Claim an open-pool instance for a member. */
  claimInstance: (instanceId: string, memberId: string) => Promise<ChoreInstance>
  /** Assign an instance to a member. */
  assignInstance: (
    instanceId: string,
    assigneeId: string,
    assignerId: string,
  ) => Promise<ChoreInstance>
  /** Update an instance's status. */
  updateInstanceStatus: (
    instanceId: string,
    status: InstanceStatus,
    actorId: string,
  ) => Promise<ChoreInstance>
  /** Delete (archive) an instance. Only active/archived instances can be deleted. */
  deleteInstance: (instanceId: string) => Promise<ChoreInstance>
  /** Revert an instance's status by one step (completed→in_progress→active). */
  revertInstanceStatus: (instanceId: string) => Promise<ChoreInstance>
  /** Reset an instance to active status regardless of current status. */
  resetInstance: (instanceId: string) => Promise<ChoreInstance>
  /** Create a new chore category. */
  createCategory: (name: string) => Promise<ChoreCategory>
  /** Create a new chore tag. */
  createTag: (name: string) => Promise<ChoreTag>
}

/**
 * Provides chore mutation actions with automatic cache invalidation.
 *
 * Uses React Query's invalidateQueries to force a refetch after mutations,
 * bypassing the staleTime window that would otherwise prevent updates.
 *
 * @returns All chore mutation actions.
 */
export function useChoreActions(): UseChoreActionsReturn {
  const queryClient = useQueryClient()
  const { showApiError } = useErrorNotifications()

  const invalidateChores = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chores'] })
  }, [queryClient])

  const createMaster = useCallback(
    async (data: CreateMasterChoreRequest) => {
      try {
        const result = await createMasterChore(data)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to create master chore:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const updateMaster = useCallback(
    async (choreId: string, data: UpdateMasterChoreRequest) => {
      try {
        const result = await updateMasterChore(choreId, data)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to update master chore:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const deleteMaster = useCallback(
    async (choreId: string) => {
      try {
        await deleteMasterChore(choreId)
        invalidateChores()
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to delete master chore:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const permanentDeleteMaster = useCallback(
    async (choreId: string) => {
      try {
        await permanentDeleteMasterChore(choreId)
        invalidateChores()
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to permanently delete master chore:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const bulkUpdateMasterStatusAction = useCallback(
    async (masterIds: string[], status: MasterChoreStatus) => {
      try {
        const result = await bulkUpdateMasterStatus(masterIds, status)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to bulk update master status:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const createAssociationAction = useCallback(
    async (data: CreateAssociationRequest) => {
      try {
        const result = await createAssociation(data)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to create association:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const deleteAssociationAction = useCallback(
    async (associationId: string) => {
      try {
        await deleteAssociation(associationId)
        invalidateChores()
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to delete association:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const claimInstanceAction = useCallback(
    async (instanceId: string, memberId: string) => {
      try {
        const result = await claimInstance(instanceId, memberId)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to claim instance:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const assignInstanceAction = useCallback(
    async (instanceId: string, assigneeId: string, assignerId: string) => {
      try {
        const result = await assignInstance(instanceId, assigneeId, assignerId)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to assign instance:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const updateInstanceStatusAction = useCallback(
    async (instanceId: string, status: InstanceStatus, actorId: string) => {
      try {
        const result = await updateInstanceStatus(instanceId, status, actorId)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to update instance status:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const deleteInstanceAction = useCallback(
    async (instanceId: string) => {
      try {
        const result = await deleteInstance(instanceId)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to delete instance:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const revertInstanceStatusAction = useCallback(
    async (instanceId: string) => {
      try {
        const result = await revertInstanceStatus(instanceId)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to revert instance status:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const resetInstanceAction = useCallback(
    async (instanceId: string) => {
      try {
        const result = await resetInstance(instanceId)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to reset instance:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const createCategoryAction = useCallback(
    async (name: string) => {
      try {
        const result = await createCategory(name)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to create category:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  const createTagAction = useCallback(
    async (name: string) => {
      try {
        const result = await createTag(name)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to create tag:', error)
        throw error
      }
    },
    [invalidateChores, showApiError],
  )

  return {
    createMaster,
    updateMaster,
    deleteMaster,
    permanentDeleteMaster,
    bulkUpdateMasterStatus: bulkUpdateMasterStatusAction,
    createAssociation: createAssociationAction,
    deleteAssociation: deleteAssociationAction,
    claimInstance: claimInstanceAction,
    assignInstance: assignInstanceAction,
    updateInstanceStatus: updateInstanceStatusAction,
    deleteInstance: deleteInstanceAction,
    revertInstanceStatus: revertInstanceStatusAction,
    resetInstance: resetInstanceAction,
    createCategory: createCategoryAction,
    createTag: createTagAction,
  }
}
