/**
 * Chores domain utilities.
 *
 * Pure functions for filtering, classifying, and formatting chore data.
 * Used across the chores feature components and hooks.
 */

import type {
  ChoreInstance,
  ChoreAssociation,
  InstanceStatus,
  RecurrenceRule,
} from '@/types/chores'
import { colors } from '@/theme/tokens'
import { formatTime, today } from '@/shared/date'

/** Day-of-week names indexed by RecurrenceRule convention (0=Monday, 6=Sunday). */
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Month names indexed 1-12. */
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Ordinal suffixes for day-of-month formatting. */
const ORDINAL_SUFFIXES: Record<number, string> = {
  1: 'st', 2: 'nd', 3: 'rd', 21: 'st', 22: 'nd', 23: 'rd', 31: 'st',
}

/**
 * Checks whether a chore instance is in the open pool (unclaimed and unassigned).
 *
 * An instance is in the open pool when both `claimed_by` and `assigned_to`
 * are null — nobody has taken ownership yet.
 *
 * @param instance - The chore instance to check.
 * @returns True if the instance is unclaimed and unassigned.
 */
export function isOpenPoolInstance(instance: ChoreInstance): boolean {
  return instance.claimed_by === null && instance.assigned_to === null
}

/**
 * Returns instances belonging to a specific member.
 *
 * A member "owns" an instance if they claimed it or were assigned to it.
 *
 * @param instances - All chore instances.
 * @param memberId - The member's key/ID.
 * @returns Instances where claimed_by or assigned_to matches the member.
 */
export function getMemberInstances(instances: ChoreInstance[], memberId: string): ChoreInstance[] {
  return instances.filter((inst) => inst.claimed_by === memberId || inst.assigned_to === memberId)
}

/**
 * Returns associations belonging to a specific member.
 *
 * @param associations - All chore associations.
 * @param memberId - The member's key/ID.
 * @returns Associations where member_id matches (excludes open pool).
 */
export function getMemberAssociations(
  associations: ChoreAssociation[],
  memberId: string,
): ChoreAssociation[] {
  return associations.filter(
    (assoc) => assoc.member_id === memberId && assoc.removed_at === null,
  )
}

/** Metrics for a board column (member or open pool). */
export interface ColumnMetrics {
  /** Total assigned instances. */
  assigned: number
  /** Claimed instances (voluntary). */
  claimed: number
  /** In-progress instances. */
  inProgress: number
  /** Completed instances. */
  completed: number
  /** Overdue instances. */
  overdue: number
}

/**
 * Calculate metrics for a board column from its instances.
 *
 * @param instances - Instances in this column.
 * @returns Metric counts for display.
 */
export function getColumnMetrics(instances: ChoreInstance[]): ColumnMetrics {
  return {
    assigned: instances.filter((i) => i.assigned_to !== null).length,
    claimed: instances.filter((i) => i.claimed_by !== null).length,
    inProgress: instances.filter((i) => i.status === 'in_progress').length,
    completed: instances.filter((i) => i.status === 'completed').length,
    overdue: instances.filter((i) => i.status === 'overdue').length,
  }
}

/** Metrics for the open pool column. */
export interface OpenPoolMetrics {
  /** Total instances in the open pool. */
  total: number
  /** Overdue instances. */
  overdue: number
  /** Instances due today. */
  dueToday: number
}

/**
 * Calculate metrics for the open pool column.
 *
 * Open pool instances are unclaimed and unassigned, so member-specific
 * metrics (assigned, claimed) don't apply. Instead, we show:
 * - Total: all open pool instances
 * - Overdue: instances past their period
 * - Due Today: instances with period_start = today
 *
 * @param instances - Open pool instances.
 * @returns Open pool metric counts for display.
 */
export function getOpenPoolMetrics(instances: ChoreInstance[]): OpenPoolMetrics {
  const todayStr = today().toString()
  return {
    total: instances.length,
    overdue: instances.filter((i) => i.status === 'overdue').length,
    dueToday: instances.filter((i) => i.period_start === todayStr).length,
  }
}

/**
 * Returns all active open pool associations.
 *
 * @param associations - All chore associations.
 * @returns Associations where is_open_pool is true and not removed.
 */
export function getOpenPoolAssociations(associations: ChoreAssociation[]): ChoreAssociation[] {
  return associations.filter(
    (assoc) => assoc.is_open_pool && assoc.removed_at === null,
  )
}

/**
 * Returns the CSS color token for a given instance status.
 *
 * @param status - The chore instance status.
 * @returns A CSS color string from the design tokens.
 */
export function getStatusColor(status: InstanceStatus): string {
  const colorMap: Record<InstanceStatus, string> = {
    active: colors.choresActive,
    in_progress: colors.choresInProgress,
    completed: colors.choresCompleted,
    overdue: colors.choresOverdue,
    missed: colors.choresMissed,
    archived: colors.choresArchived,
  }
  return colorMap[status]
}

/**
 * Returns a human-readable difficulty label for a numeric level.
 *
 * @param level - Difficulty level (1–5).
 * @returns Display string (e.g. "Easy", "Medium", "Hard").
 */
export function formatDifficulty(level: number): string {
  if (level <= 1) return 'Easy'
  if (level <= 2) return 'Easy-Medium'
  if (level <= 3) return 'Medium'
  if (level <= 4) return 'Hard'
  return 'Very Hard'
}

/**
 * Returns a human-readable label for an instance status.
 *
 * @param status - The chore instance status.
 * @returns Display string for the status.
 */
export function getStatusLabel(status: InstanceStatus): string {
  const labelMap: Record<InstanceStatus, string> = {
    active: 'Active',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
    missed: 'Missed',
    archived: 'Archived',
  }
  return labelMap[status]
}

/**
 * Format a day-of-month number with ordinal suffix.
 *
 * @param day - Day of month (1-31).
 * @returns Formatted string (e.g. "1st", "2nd", "3rd", "4th").
 */
function formatOrdinalDay(day: number): string {
  const suffix = ORDINAL_SUFFIXES[day] ?? 'th'
  return `${day}${suffix}`
}

/**
 * Format an nth-week-of-month ordinal.
 *
 * @param week - Week of month (1-5).
 * @returns Formatted string (e.g. "first", "second", "third").
 */
function formatWeekOrdinal(week: number): string {
  const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth']
  return ordinals[week] ?? `${week}th`
}

/**
 * Format a recurrence rule as a human-readable summary.
 *
 * Converts UTC time to the configured timezone for display.
 *
 * @param rule - Recurrence rule to format, or null.
 * @param timezone - IANA timezone for time display (e.g. "America/New_York").
 *   If omitted, the raw UTC time is shown.
 * @returns Human-readable summary (e.g. "Weekly on Monday at 8:00 AM").
 */
export function formatRecurrence(rule: RecurrenceRule | null, _timezone?: string): string {
  if (!rule) return 'No recurrence'

  // rule.time is a local-time string (HH:MM), not UTC — no timezone conversion
  const timeStr = rule.time
    ? formatTime(Temporal.PlainTime.from(rule.time))
    : ''

  switch (rule.frequency) {
    case 'once':
      return 'One-time'

    case 'daily':
      return `Daily at ${timeStr}`

    case 'weekly': {
      const dayName = rule.day_of_week != null
        ? DAY_NAMES[rule.day_of_week]
        : 'unknown day'
      return `Weekly on ${dayName} at ${timeStr}`
    }

    case 'monthly': {
      if (rule.day_of_month != null) {
        return `Monthly on the ${formatOrdinalDay(rule.day_of_month)} at ${timeStr}`
      }
      if (rule.day_of_week != null && rule.week_of_month != null) {
        const dayName = DAY_NAMES[rule.day_of_week]
        const weekOrd = formatWeekOrdinal(rule.week_of_month)
        return `Monthly on the ${weekOrd} ${dayName} at ${timeStr}`
      }
      return `Monthly at ${timeStr}`
    }

    case 'yearly': {
      const monthName = rule.month != null
        ? MONTH_NAMES[rule.month]
        : 'unknown month'

      if (rule.day_of_month != null) {
        return `Yearly on ${monthName} ${formatOrdinalDay(rule.day_of_month)} at ${timeStr}`
      }
      if (rule.day_of_week != null && rule.week_of_month != null) {
        const dayName = DAY_NAMES[rule.day_of_week]
        const weekOrd = formatWeekOrdinal(rule.week_of_month)
        return `Yearly on the ${weekOrd} ${dayName} of ${monthName} at ${timeStr}`
      }
      return `Yearly in ${monthName} at ${timeStr}`
    }

    default:
      return 'Unknown recurrence'
  }
}
