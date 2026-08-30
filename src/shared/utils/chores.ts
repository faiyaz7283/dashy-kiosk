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
  MasterChore,
} from '@/types/chores'
import { colors } from '@/theme/tokens'
import { formatTime } from '@/shared/date'

/** Day-of-week names indexed by backend convention (0=Monday, 6=Sunday). */
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
 * Checks whether a chore instance is in the open pool (unassigned).
 *
 * An instance is in the open pool when `member_id` is null.
 *
 * @param instance - The chore instance to check.
 * @returns True if the instance is unassigned.
 */
export function isOpenPoolInstance(instance: ChoreInstance): boolean {
  return instance.member_id === null
}

/**
 * Returns instances belonging to a specific member.
 *
 * A member "owns" an instance if their member_id matches.
 *
 * @param instances - All chore instances.
 * @param memberId - The member's key/ID.
 * @returns Instances where member_id matches the member.
 */
export function getMemberInstances(instances: ChoreInstance[], memberId: string): ChoreInstance[] {
  return instances.filter((inst) => inst.member_id === memberId)
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
  /** Assigned instances (ACTIVE with assigned_by != null). */
  assigned: number
  /** Claimed instances (ACTIVE with assigned_by == null). */
  claimed: number
  /** In-progress instances. */
  inProgress: number
  /** Completed instances. */
  completed: number
  /** Overdue/missed instances. */
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
    assigned: instances.filter((i) => i.status === 'active' && i.assigned_by !== null).length,
    claimed: instances.filter((i) => i.status === 'active' && i.assigned_by === null).length,
    inProgress: instances.filter((i) => i.status === 'in_progress').length,
    completed: instances.filter((i) => i.status === 'completed').length,
    overdue: instances.filter((i) => i.status === 'overdue' || i.status === 'missed').length,
  }
}

/** Metrics for the open pool column. */
export interface OpenPoolMetrics {
  /** Available instances (ACTIVE). */
  available: number
  /** Overdue/missed instances. */
  overdue: number
}

/**
 * Calculate metrics for the open pool column.
 *
 * Open pool instances are unassigned (member_id === null).
 *
 * @param instances - Open pool instances.
 * @returns Open pool metric counts for display.
 */
export function getOpenPoolMetrics(instances: ChoreInstance[]): OpenPoolMetrics {
  return {
    available: instances.filter((i) => i.status === 'active').length,
    overdue: instances.filter((i) => i.status === 'overdue' || i.status === 'missed').length,
  }
}

/**
 * Returns all active open pool associations.
 *
 * @param associations - All chore associations.
 * @returns Associations where member_id is null and not removed.
 */
export function getOpenPoolAssociations(associations: ChoreAssociation[]): ChoreAssociation[] {
  return associations.filter(
    (assoc) => assoc.member_id === null && assoc.removed_at === null,
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
 * Format a master chore's recurrence pattern as a human-readable summary.
 *
 * Reads the flattened recurrence fields from the master chore.
 *
 * @param master - Master chore to format recurrence for.
 * @param timezone - IANA timezone for time display (e.g. "America/New_York").
 *   If omitted, the raw time is shown.
 * @returns Human-readable summary (e.g. "Weekly on Monday at 8:00 AM").
 */
export function formatRecurrence(master: MasterChore, _timezone?: string): string {
  const timeStr = master.due_time
    ? formatTime(Temporal.PlainTime.from(master.due_time))
    : ''

  switch (master.frequency) {
    case 'once':
      return 'One-time'

    case 'daily':
      return master.frequency_interval === 1
        ? `Daily at ${timeStr}`
        : `Every ${master.frequency_interval} days at ${timeStr}`

    case 'weekly': {
      if (master.day_of_week && master.day_of_week.length > 0) {
        const dayNames = master.day_of_week.map((d) => DAY_NAMES[d] ?? `day ${d}`).join(', ')
        return master.frequency_interval === 1
          ? `Weekly on ${dayNames} at ${timeStr}`
          : `Every ${master.frequency_interval} weeks on ${dayNames} at ${timeStr}`
      }
      return `Weekly at ${timeStr}`
    }

    case 'monthly': {
      const prefix = master.frequency_interval === 1 ? 'Monthly' : `Every ${master.frequency_interval} months`
      if (master.day_of_month != null) {
        return `${prefix} on the ${formatOrdinalDay(master.day_of_month)} at ${timeStr}`
      }
      if (master.day_of_week && master.day_of_week.length > 0 && master.week_of_month != null) {
        const firstDay = master.day_of_week[0]
        const dayName = firstDay != null ? (DAY_NAMES[firstDay] ?? `day ${firstDay}`) : 'unknown day'
        const weekOrd = formatWeekOrdinal(master.week_of_month)
        return `${prefix} on the ${weekOrd} ${dayName} at ${timeStr}`
      }
      return `Monthly at ${timeStr}`
    }

    case 'yearly': {
      const monthName = master.month != null
        ? MONTH_NAMES[master.month]
        : 'unknown month'
      const prefix = master.frequency_interval === 1 ? 'Yearly' : `Every ${master.frequency_interval} years`

      if (master.day_of_month != null) {
        return `${prefix} on ${monthName} ${formatOrdinalDay(master.day_of_month)} at ${timeStr}`
      }
      if (master.day_of_week && master.day_of_week.length > 0 && master.week_of_month != null) {
        const firstDay = master.day_of_week[0]
        const dayName = firstDay != null ? (DAY_NAMES[firstDay] ?? `day ${firstDay}`) : 'unknown day'
        const weekOrd = formatWeekOrdinal(master.week_of_month)
        return `${prefix} on the ${weekOrd} ${dayName} of ${monthName} at ${timeStr}`
      }
      return `Yearly in ${monthName} at ${timeStr}`
    }

    default:
      return 'Unknown recurrence'
  }
}
