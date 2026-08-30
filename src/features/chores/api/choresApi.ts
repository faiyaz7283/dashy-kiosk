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
  MasterChoreStatus,
  CreateMasterChoreRequest,
  UpdateMasterChoreRequest,
  CreateAssociationRequest,
  AssociationCreateResponse,
  UpdateInstanceRequest,
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
 * Permanently delete a master chore and all related data.
 *
 * Hard-deletes the master, its associations, and all instances.
 * This action cannot be undone.
 *
 * @param choreId - The master chore ID to permanently delete.
 */
export async function permanentDeleteMasterChore(choreId: string): Promise<void> {
  const response = await fetch(`${BASE}/masters/${choreId}?permanent=true`, {
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
 * Update a chore instance via the consolidated PATCH endpoint.
 *
 * Supports claim, assign, revert, reset, and status change actions
 * through a single endpoint with an action-based request body.
 *
 * @param id - The instance ID to update.
 * @param data - Update request with action, status, member_id, etc.
 * @returns The updated instance.
 */
export async function updateInstance(
  id: string,
  data: UpdateInstanceRequest,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${id}`, {
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
 * Delete (archive) a chore instance.
 *
 * Only instances with status ACTIVE or ARCHIVED can be deleted.
 * Instances with status IN_PROGRESS, COMPLETED, MISSED, or OVERDUE
 * cannot be deleted — they must be resolved first.
 *
 * @param instanceId - Instance identifier.
 * @returns The archived instance.
 */
export async function deleteInstance(instanceId: string): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}`, {
    method: 'DELETE',
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
