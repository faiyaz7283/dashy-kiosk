/**
 * Chores API functions.
 *
 * All CRUD operations for master chores, instances, associations,
 * categories, and tags. Uses direct fetch() against the dashy-api endpoints.
 */

import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseApiError } from '@/shared/errors'
import type {
  ChoresData,
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

const BASE = ENDPOINTS.chores.url

/**
 * Fetch all chores data (categories, tags, masters, associations, instances).
 *
 * @returns Complete chores data payload.
 */
export async function fetchChores(): Promise<ChoresData> {
  const response = await fetch(BASE)
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Synchronize chore instance state.
 *
 * Triggers the safety net to generate missing instances, mark overdue
 * instances, and process expired instances. Must be called explicitly
 * by the frontend on mount/refresh — GET is read-only.
 *
 * @returns void (204 No Content on success).
 */
export async function syncChores(): Promise<void> {
  const response = await fetch(`${BASE}/sync`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
}

/**
 * Create a new master chore template.
 *
 * @param data - Master chore fields.
 * @returns The created master chore.
 */
export async function createMasterChore(
  data: CreateMasterChoreRequest,
): Promise<MasterChore> {
  const response = await fetch(`${BASE}/masters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Update an existing master chore template.
 *
 * @param choreId - The master chore ID to update.
 * @param data - Updated master chore fields (partial update).
 * @returns The updated master chore.
 */
export async function updateMasterChore(
  choreId: string,
  data: UpdateMasterChoreRequest,
): Promise<MasterChore> {
  const response = await fetch(`${BASE}/masters/${choreId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Delete a master chore template (soft delete).
 *
 * @param choreId - The master chore ID to delete.
 */
export async function deleteMasterChore(choreId: string): Promise<void> {
  const response = await fetch(`${BASE}/masters/${choreId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
}

/**
 * Bulk update the status of multiple master chores.
 *
 * @param masterIds - Array of master chore IDs to update.
 * @param status - New status to apply.
 * @returns Object with updated_count.
 */
export async function bulkUpdateMasterStatus(
  masterIds: string[],
  status: MasterChoreStatus,
): Promise<{ updated_count: number }> {
  const response = await fetch(`${BASE}/masters/bulk-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ master_ids: masterIds, status }),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Create a new association between a master chore and a member/pool.
 *
 * Supports optional auto_claim and auto_assign to eliminate chained calls.
 *
 * @param data - Association creation request with optional auto_claim/auto_assign.
 * @returns The created association with generated instance.
 */
export async function createAssociation(
  data: CreateAssociationRequest,
): Promise<AssociationCreateResponse> {
  const response = await fetch(`${BASE}/associations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Delete (soft-remove) a chore association.
 *
 * @param associationId - The association ID to delete.
 */
export async function deleteAssociation(associationId: string): Promise<void> {
  const response = await fetch(`${BASE}/associations/${associationId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
}

/**
 * Claim an open-pool chore instance for a member.
 *
 * @param instanceId - The instance to claim.
 * @param memberId - The member claiming it.
 * @returns The updated instance.
 */
export async function claimInstance(
  instanceId: string,
  memberId: string,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId }),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Assign a chore instance to a member.
 *
 * @param instanceId - The instance to assign.
 * @param assigneeId - The member being assigned.
 * @param assignerId - The parent making the assignment.
 * @returns The updated instance.
 */
export async function assignInstance(
  instanceId: string,
  assigneeId: string,
  assignerId: string,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignee_id: assigneeId, assigner_id: assignerId }),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Update the status of a chore instance.
 *
 * @param instanceId - The instance to update.
 * @param status - The new status.
 * @param actorId - The member performing the action.
 * @returns The updated instance.
 */
export async function updateInstanceStatus(
  instanceId: string,
  status: InstanceStatus,
  actorId: string,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actor_id: actorId }),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Create a new chore category.
 *
 * @param name - Category display name.
 * @returns The created category.
 */
export async function createCategory(name: string): Promise<ChoreCategory> {
  const response = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}

/**
 * Create a new chore tag.
 *
 * @param name - Tag display name.
 * @returns The created tag.
 */
export async function createTag(name: string): Promise<ChoreTag> {
  const response = await fetch(`${BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return response.json()
}
