/**
 * Chores domain types.
 *
 * Defines the shape of chore categories, tags, master chore templates,
 * associations, and per-period chore instances used across the chores feature.
 *
 * Must stay in sync with the backend Pydantic models in
 * `dashy-api/app/api/models/chores.py`.
 */

/** Recurrence pattern configuration. */
export interface RecurrenceRule {
  /** How often the chore recurs. */
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  /** Time of day in HH:MM 24-hour format (UTC). */
  time: string
  /** Day of week (0=Monday, 6=Sunday). Required for weekly. */
  day_of_week?: number
  /** Day of month (1-31). Required for monthly/yearly with fixed date. */
  day_of_month?: number
  /** Week of month (1-5). Used with day_of_week for "first Monday" patterns. */
  week_of_month?: number
  /** Month (1-12). Required for yearly. */
  month?: number
}

/** What happens to an instance when its period expires. */
export type ExpirationBehavior = 'disappear' | 'carry_over' | 'stay_visible' | 'convert_to_open'

/** Lifecycle status of a master chore template. */
export type MasterChoreStatus = 'active' | 'inactive' | 'archived'

/**
 * Lifecycle status of a chore instance.
 *
 * - `active` — available to claim or be assigned
 * - `in_progress` — work has started
 * - `completed` — fully done
 * - `overdue` — past due and not completed
 * - `missed` — period ended without completion
 * - `archived` — soft-deleted
 */
export type InstanceStatus =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'missed'
  | 'archived'

/** A chore category (e.g. Kitchen, Bathroom, Outdoor). */
export interface ChoreCategory {
  /** Unique identifier. */
  id: string
  /** Display name. */
  name: string
}

/** A tag for labeling chores (e.g. "Quick", "Heavy"). */
export interface ChoreTag {
  /** Unique identifier. */
  id: string
  /** Display name. */
  name: string
}

/**
 * Association between a master chore and a member or open pool.
 *
 * Associations trigger instance generation and track who is responsible
 * for a chore. Soft-deleted by setting removed_at.
 */
export interface ChoreAssociation {
  /** Unique identifier. */
  id: string
  /** FK to the master chore template. */
  master_chore_id: string
  /** FK to the family member (null for open pool). */
  member_id: string | null
  /** Whether this is an open pool (anyone can claim). */
  is_open_pool: boolean
  /** Member ID who created this association. */
  created_by: string
  /** ISO datetime when created. */
  created_at: string
  /** ISO datetime when last updated. */
  updated_at: string
  /** ISO datetime when soft-deleted, or null if active. */
  removed_at: string | null
}

/**
 * Master chore template.
 *
 * Defines the chore definition from which per-period instances are generated.
 * One master can produce many instances over time based on its recurrence_rule.
 */
export interface MasterChore {
  /** Unique identifier. */
  id: string
  /** Chore name (e.g. "Wipe Kitchen Counter"). */
  name: string
  /** Category this chore belongs to. */
  category: ChoreCategory
  /** Tags associated with this chore. */
  tags: ChoreTag[]
  /** Difficulty level (1–5). */
  difficulty: number
  /** Recurrence pattern config, or null for one-off chores. */
  recurrence_rule: RecurrenceRule | null
  /** Estimated time in minutes, or null if not set. */
  estimated_minutes: number | null
  /** Optional due time-of-day (ISO time string), or null. */
  due_time: string | null
  /** Optional due date (ISO date string) for one-off chores, or null. */
  due_date: string | null
  /** What happens when the instance period expires. */
  expiration_behavior: ExpirationBehavior
  /** Stop generating after this date (ISO date string), or null. */
  end_date: string | null
  /** Stop after N total instances generated, or null. */
  max_occurrences: number | null
  /** Total instances generated so far. */
  occurrence_count: number
  /** Conditional chore conditions (JSON), or null. */
  conditions: Record<string, unknown> | null
  /** Whether multiple members can have simultaneous instances. */
  is_collaborative: boolean
  /** Member ID of the creator. */
  created_by: string
  /** Current lifecycle status. */
  status: MasterChoreStatus
  /** ISO datetime when created. */
  created_at: string
  /** ISO datetime when last updated. */
  updated_at: string
  /** ISO datetime when soft-deleted, or null if active. */
  deleted_at: string | null
}

/**
 * Chore instance — a per-period occurrence of a master chore.
 *
 * Tracks assignment, progress, and completion for a specific period.
 */
export interface ChoreInstance {
  /** Unique identifier. */
  id: string
  /** ID of the parent master chore template. */
  master_chore_id: string
  /** FK to the association that generated this instance, or null. */
  association_id: string | null
  /** Period start date (ISO string), or null for one-off chores. */
  period_start: string | null
  /** Period end date (ISO string), or null for one-off chores. */
  period_end: string | null
  /** Current lifecycle status. */
  status: InstanceStatus
  /** Member ID who voluntarily claimed, or null. Mutually exclusive with assigned_to. */
  claimed_by: string | null
  /** Member ID who was assigned by a parent, or null. Mutually exclusive with claimed_by. */
  assigned_to: string | null
  /** Member ID of the parent who made the assignment, or null. */
  assigned_by: string | null
  /** Member ID who marked it complete, or null. */
  completed_by: string | null
  /** ISO datetime when work began, or null. */
  started_at: string | null
  /** ISO datetime when marked complete, or null. */
  completed_at: string | null
  /** ISO datetime when created. */
  created_at: string
  /** ISO datetime when last updated. */
  updated_at: string
}

/**
 * Complete chores data response from the API.
 *
 * Contains all reference data (categories, tags), master chore templates,
 * associations, and active instances in a single payload.
 */
export interface ChoresData {
  /** Available chore categories. */
  categories: ChoreCategory[]
  /** Available tags. */
  tags: ChoreTag[]
  /** Master chore templates. */
  master_chores: MasterChore[]
  /** All chore associations. */
  associations: ChoreAssociation[]
  /** Active chore instances. */
  instances: ChoreInstance[]
}

/** Request payload for creating a new master chore. */
export interface CreateMasterChoreRequest {
  /** Chore name. */
  name: string
  /** Category ID. */
  category_id: string
  /** Tag IDs to associate. */
  tag_ids?: string[]
  /** Difficulty level (1–5). */
  difficulty?: number
  /** Recurrence pattern config. */
  recurrence_rule?: RecurrenceRule | null
  /** Estimated time in minutes. */
  estimated_minutes?: number | null
  /** Due time-of-day (ISO time string). */
  due_time?: string | null
  /** Due date (ISO date string) for one-off chores. */
  due_date?: string | null
  /** What happens when the instance period expires. */
  expiration_behavior?: ExpirationBehavior
  /** Stop generating after this date. */
  end_date?: string | null
  /** Stop after N total instances. */
  max_occurrences?: number | null
  /** Conditional chore conditions (JSON). */
  conditions?: Record<string, unknown> | null
  /** Whether multiple members can have instances. */
  is_collaborative?: boolean
  /** Member ID of the creator (required). */
  created_by: string
}

/** Request payload for updating a master chore. */
export interface UpdateMasterChoreRequest {
  /** Chore name. */
  name?: string
  /** Category ID. */
  category_id?: string
  /** Tag IDs to associate. */
  tag_ids?: string[]
  /** Difficulty level (1–5). */
  difficulty?: number
  /** Recurrence pattern config. */
  recurrence_rule?: RecurrenceRule | null
  /** Estimated time in minutes. */
  estimated_minutes?: number | null
  /** Due time-of-day (ISO time string). */
  due_time?: string | null
  /** Due date (ISO date string) for one-off chores. */
  due_date?: string | null
  /** What happens when the instance period expires. */
  expiration_behavior?: ExpirationBehavior
  /** Stop generating after this date. */
  end_date?: string | null
  /** Stop after N total instances. */
  max_occurrences?: number | null
  /** Conditional chore conditions (JSON). */
  conditions?: Record<string, unknown> | null
  /** Whether multiple members can have instances. */
  is_collaborative?: boolean
  /** Lifecycle status. */
  status?: MasterChoreStatus
}

/** Request payload for creating a chore association. */
export interface CreateAssociationRequest {
  /** Master chore to associate. */
  master_chore_id: string
  /** Member to associate (null for open pool). */
  member_id?: string
  /** Whether this is an open pool. */
  is_open_pool?: boolean
  /** Member ID creating the association. */
  created_by: string
}
