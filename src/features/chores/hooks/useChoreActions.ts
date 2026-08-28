/**
 * Hook for chore mutation actions.
 *
 * Provides typed wrappers around all chores API mutation functions.
 * Each action triggers a refetch after completion to keep data in sync.
 */

import { useCallback } from 'react'
import {
  createMasterChore,
  updateMasterChore,
  deleteMasterChore,
  bulkUpdateMasterStatus,
  createAssociation,
  deleteAssociation,
  claimInstance,
  assignInstance,
  updateInstanceStatus,
  createCategory,
  createTag,
} from '../api/choresApi'
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
  /** Create a new chore category. */
  createCategory: (name: string) => Promise<ChoreCategory>
  /** Create a new chore tag. */
  createTag: (name: string) => Promise<ChoreTag>
}

/**
 * Provides chore mutation actions with automatic refetch.
 *
 * @param refetch - Function to trigger a data refetch after mutations.
 * @returns All chore mutation actions.
 */
export function useChoreActions(
  refetch: () => void,
): UseChoreActionsReturn {
  const createMaster = useCallback(
    async (data: CreateMasterChoreRequest) => {
      try {
        const result = await createMasterChore(data)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to create master chore:', error)
        throw error
      }
    },
    [refetch],
  )

  const updateMaster = useCallback(
    async (choreId: string, data: UpdateMasterChoreRequest) => {
      try {
        const result = await updateMasterChore(choreId, data)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to update master chore:', error)
        throw error
      }
    },
    [refetch],
  )

  const deleteMaster = useCallback(
    async (choreId: string) => {
      try {
        await deleteMasterChore(choreId)
        refetch()
      } catch (error) {
        console.error('Failed to delete master chore:', error)
        throw error
      }
    },
    [refetch],
  )

  const bulkUpdateMasterStatusAction = useCallback(
    async (masterIds: string[], status: MasterChoreStatus) => {
      try {
        const result = await bulkUpdateMasterStatus(masterIds, status)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to bulk update master status:', error)
        throw error
      }
    },
    [refetch],
  )

  const createAssociationAction = useCallback(
    async (data: CreateAssociationRequest) => {
      try {
        const result = await createAssociation(data)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to create association:', error)
        throw error
      }
    },
    [refetch],
  )

  const deleteAssociationAction = useCallback(
    async (associationId: string) => {
      try {
        await deleteAssociation(associationId)
        refetch()
      } catch (error) {
        console.error('Failed to delete association:', error)
        throw error
      }
    },
    [refetch],
  )

  const claimInstanceAction = useCallback(
    async (instanceId: string, memberId: string) => {
      try {
        const result = await claimInstance(instanceId, memberId)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to claim instance:', error)
        throw error
      }
    },
    [refetch],
  )

  const assignInstanceAction = useCallback(
    async (instanceId: string, assigneeId: string, assignerId: string) => {
      try {
        const result = await assignInstance(instanceId, assigneeId, assignerId)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to assign instance:', error)
        throw error
      }
    },
    [refetch],
  )

  const updateInstanceStatusAction = useCallback(
    async (instanceId: string, status: InstanceStatus, actorId: string) => {
      try {
        const result = await updateInstanceStatus(instanceId, status, actorId)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to update instance status:', error)
        throw error
      }
    },
    [refetch],
  )

  const createCategoryAction = useCallback(
    async (name: string) => {
      try {
        const result = await createCategory(name)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to create category:', error)
        throw error
      }
    },
    [refetch],
  )

  const createTagAction = useCallback(
    async (name: string) => {
      try {
        const result = await createTag(name)
        refetch()
        return result
      } catch (error) {
        console.error('Failed to create tag:', error)
        throw error
      }
    },
    [refetch],
  )

  return {
    createMaster,
    updateMaster,
    deleteMaster,
    bulkUpdateMasterStatus: bulkUpdateMasterStatusAction,
    createAssociation: createAssociationAction,
    deleteAssociation: deleteAssociationAction,
    claimInstance: claimInstanceAction,
    assignInstance: assignInstanceAction,
    updateInstanceStatus: updateInstanceStatusAction,
    createCategory: createCategoryAction,
    createTag: createTagAction,
  }
}
