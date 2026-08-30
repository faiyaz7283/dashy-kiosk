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
  updateInstance,
  deleteInstance,
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
  MasterChoreStatus,
  CreateMasterChoreRequest,
  UpdateMasterChoreRequest,
  CreateAssociationRequest,
  AssociationCreateResponse,
  UpdateInstanceRequest,
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
  /** Update a chore instance (claim, assign, revert, reset, or status change). */
  updateInstance: (
    id: string,
    data: UpdateInstanceRequest,
  ) => Promise<ChoreInstance>
  /** Delete (archive) an instance. Only active/archived instances can be deleted. */
  deleteInstance: (instanceId: string) => Promise<ChoreInstance>
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

  const updateInstanceAction = useCallback(
    async (id: string, data: UpdateInstanceRequest) => {
      try {
        const result = await updateInstance(id, data)
        invalidateChores()
        return result
      } catch (error) {
        if (error instanceof ApiError) showApiError(error)
        else console.error('Failed to update instance:', error)
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
    updateInstance: updateInstanceAction,
    deleteInstance: deleteInstanceAction,
    createCategory: createCategoryAction,
    createTag: createTagAction,
  }
}
