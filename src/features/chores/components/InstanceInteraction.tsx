/**
 * Instance interaction popup — shows details and actions for a chore instance.
 *
 * Displays instance information with status-specific styling and actions:
 * - Active: "Start" button
 * - In Progress: "Complete" button + "Started at" time
 * - Overdue: "Complete Now" button with overdue styling
 * - Missed: disabled "Cannot Complete (Missed)" button
 * - Open Pool: "Claim by" dropdown + "Assign" dropdown with two selectors
 *
 * Attribution display:
 * - Claimed: "Claimed by {Name}"
 * - Assigned: "Assigned by {Assigner} to {Assignee}"
 *
 * All variants include "View Template" link to navigate to the master chore.
 */

import { useState, useMemo } from 'react'
import {
  RotateCw,
  Calendar,
  Clock,
  User,
  Users,
  Play,
  CheckCircle,
  Edit3,
  X,
  ChevronDown,
} from 'lucide-react'
import type { ChoreInstance, MasterChore, ChoreCategory, InstanceStatus } from '@/types/chores'
import type { FamilyMember } from '@/types/family'
import { formatRecurrence } from '@/shared/utils/chores'
import { formatUtcTimeOfDay, formatUtcTime, useConfig } from '@/shared/date'
import { formatDateParts } from '@/shared/date/format'
import {
  paletteBgClasses,
  getMemberPaletteKey,
  type PaletteKey,
} from '@/shared/utils/memberColors'
import { isOpenPoolInstance } from '@/shared/utils/chores'
import { useNotifications } from '@/shared/context/NotificationContext'

/** Status badge config — static class map. */
const statusBadgeClasses: Record<InstanceStatus, { container: string; dot: string }> = {
  active: {
    container: 'bg-chores-active/10 text-chores-active',
    dot: 'bg-chores-active',
  },
  in_progress: {
    container: 'bg-chores-in-progress/10 text-chores-in-progress',
    dot: 'bg-chores-in-progress',
  },
  completed: {
    container: 'bg-chores-completed/10 text-chores-completed',
    dot: 'bg-chores-completed',
  },
  overdue: {
    container: 'bg-chores-overdue/10 text-chores-overdue',
    dot: 'bg-chores-overdue',
  },
  missed: {
    container: 'bg-chores-missed/10 text-chores-missed',
    dot: 'bg-chores-missed',
  },
  archived: {
    container: 'bg-chores-archived/10 text-text-muted',
    dot: 'bg-chores-archived',
  },
}

/** Status display labels. */
const statusLabels: Record<InstanceStatus, string> = {
  active: 'Active',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  missed: 'Missed',
  archived: 'Archived',
}

/** Props for the InstanceInteraction component. */
export interface InstanceInteractionProps {
  /** The chore instance to display. */
  instance: ChoreInstance
  /** The parent master chore template. */
  masterChore: MasterChore
  /** All available categories. */
  categories: ChoreCategory[]
  /** Family members for name/avatar lookup. */
  members: FamilyMember[]
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Callback when the popup should close. */
  onClose: () => void
  /** Callback when Start action is triggered (active → in_progress). */
  onStart?: () => void
  /** Callback when Complete action is triggered (in_progress → completed). */
  onComplete?: () => void
  /** Callback when Claim action is triggered (open pool). */
  onClaim?: (memberId: string) => void
  /** Callback when Assign action is triggered (open pool). */
  onAssign?: (assigneeId: string, assignerId: string) => void
  /** Callback when View Template link is clicked. */
  onViewTemplate?: () => void
}

/**
 * Instance interaction popup with status-specific actions.
 *
 * @param props - Component props.
 * @returns The instance interaction popup UI.
 */
export function InstanceInteraction({
  instance,
  masterChore,
  categories,
  members,
  colorMap,
  onClose,
  onStart,
  onComplete,
  onClaim,
  onAssign,
  onViewTemplate,
}: InstanceInteractionProps) {
  const { timezone } = useConfig()
  const { addNotification } = useNotifications()

  const [claimDropdownOpen, setClaimDropdownOpen] = useState(false)
  const [assignTo, setAssignTo] = useState<string>('')
  const [assignBy, setAssignBy] = useState<string>('')

  const isOpenPool = isOpenPoolInstance(instance)
  const badge = statusBadgeClasses[instance.status]

  // Get category name
  const categoryName = useMemo(() => {
    const category = categories.find((c) => c.id === masterChore.category.id)
    return category?.name ?? 'Uncategorized'
  }, [categories, masterChore.category.id])

  // Get member info for avatar
  const memberInfo = useMemo(() => {
    const memberKey = instance.claimed_by ?? instance.assigned_to
    if (!memberKey) return null

    const member = members.find((m) => m.key === memberKey)
    if (!member) return null

    const paletteKey = getMemberPaletteKey(member.key, colorMap)
    return { member, paletteKey }
  }, [instance, members, colorMap])

  // Format recurrence summary
  const recurrenceSummary = formatRecurrence(masterChore.recurrence_rule, timezone)

  // Format period date (e.g., "Monday, Aug 25")
  const periodDate = useMemo(() => {
    if (!instance.period_start) return null
    const dateStr = instance.period_start.replace(/Z$/, '')
    const plainDate = Temporal.PlainDate.from(dateStr)
    return formatDateParts(plainDate, { weekday: 'long', month: 'short', day: 'numeric' })
  }, [instance.period_start])

  // Format due time
  const dueTimeFormatted = useMemo(() => {
    if (!masterChore.due_time) return null
    return formatUtcTimeOfDay(masterChore.due_time, timezone)
  }, [masterChore.due_time, timezone])

  // Format started time
  const startedTimeFormatted = useMemo(() => {
    if (!instance.started_at) return null
    return formatUtcTime(instance.started_at, timezone)
  }, [instance.started_at, timezone])

  // Attribution text
  const attributionText = useMemo(() => {
    if (instance.claimed_by) {
      const member = members.find((m) => m.key === instance.claimed_by)
      return `Claimed by ${member?.name ?? instance.claimed_by}`
    }
    if (instance.assigned_to && instance.assigned_by) {
      const assignee = members.find((m) => m.key === instance.assigned_to)
      const assigner = members.find((m) => m.key === instance.assigned_by)
      return `Assigned by ${assigner?.name ?? instance.assigned_by} to ${assignee?.name ?? instance.assigned_to}`
    }
    if (instance.assigned_to) {
      const assignee = members.find((m) => m.key === instance.assigned_to)
      return `Assigned to ${assignee?.name ?? instance.assigned_to}`
    }
    return null
  }, [instance, members])

  // Open pool action handlers
  const handleClaim = (memberId: string) => {
    if (onClaim) {
      onClaim(memberId)
      const member = members.find((m) => m.key === memberId)
      addNotification({
        type: 'success',
        title: 'Instance claimed',
        message: `${member?.name ?? 'Unknown'} claimed this chore`,
      })
    }
    setClaimDropdownOpen(false)
  }

  const handleAssign = () => {
    if (!assignTo || !assignBy) return
    if (onAssign) {
      onAssign(assignTo, assignBy)
      const assignee = members.find((m) => m.key === assignTo)
      const assigner = members.find((m) => m.key === assignBy)
      addNotification({
        type: 'success',
        title: 'Instance assigned',
        message: `${assigner?.name ?? 'Unknown'} assigned this chore to ${assignee?.name ?? assignTo}`,
      })
    }
    setAssignTo('')
    setAssignBy('')
  }

  // Determine action button
  const actionButton = useMemo(() => {
    if (instance.status === 'active' && !isOpenPool) {
      return (
        <button
          onClick={onStart}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-chores-active px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-chores-active/90"
        >
          <Play className="h-4 w-4" />
          Start
        </button>
      )
    }
    if (instance.status === 'in_progress') {
      return (
        <button
          onClick={onComplete}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-chores-completed px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-chores-completed/90"
        >
          <CheckCircle className="h-4 w-4" />
          Complete
        </button>
      )
    }
    if (instance.status === 'overdue') {
      return (
        <button
          onClick={onComplete}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-chores-completed px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-chores-completed/90"
        >
          <CheckCircle className="h-4 w-4" />
          Complete Now
        </button>
      )
    }
    if (instance.status === 'missed') {
      return (
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-bg-hover px-3 py-2 text-sm font-medium text-text-secondary transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          Cannot Complete (Missed)
        </button>
      )
    }
    return null
  }, [instance.status, isOpenPool, onStart, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={`w-80 overflow-hidden rounded-xl bg-white shadow-popup ring-1 ring-border dark:bg-bg ${
          instance.status === 'missed' ? 'opacity-75' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: name + status */}
        <div className="border-b border-border-light px-4 py-3">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">{masterChore.name}</h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.container}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {statusLabels[instance.status]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2.5 px-4 py-3">
          {/* Recurrence */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <RotateCw className="h-3.5 w-3.5 shrink-0" />
            <span>{recurrenceSummary}</span>
          </div>

          {/* Period date */}
          {periodDate && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{periodDate}</span>
            </div>
          )}

          {/* Due time */}
          {dueTimeFormatted && (
            <div
              className={`flex items-center gap-2 text-xs ${
                instance.status === 'overdue'
                  ? 'text-chores-overdue'
                  : instance.status === 'missed'
                    ? 'text-chores-missed'
                    : 'text-text-muted'
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Due by {dueTimeFormatted}
                {instance.status === 'overdue' && ' · Late'}
                {instance.status === 'missed' && ' · Period ended'}
              </span>
            </div>
          )}

          {/* Assignment info */}
          {isOpenPool ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Open Pool</span>
            </div>
          ) : memberInfo ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <User className="h-3.5 w-3.5 shrink-0" />
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${paletteBgClasses[memberInfo.paletteKey]}`}
                >
                  {memberInfo.member.initial}
                </div>
                <span>{memberInfo.member.name}</span>
                {attributionText && (
                  <span className="text-text-faint">· {attributionText}</span>
                )}
              </div>
            </div>
          ) : null}

          {/* Est. time */}
          {masterChore.estimated_minutes && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Est. {masterChore.estimated_minutes}m</span>
            </div>
          )}

          {/* Started time (in_progress only) */}
          {instance.status === 'in_progress' && startedTimeFormatted && (
            <div className="flex items-center gap-2 text-xs text-chores-in-progress">
              <Play className="h-3.5 w-3.5 shrink-0" />
              <span>Started at {startedTimeFormatted}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t border-border-light px-4 py-3">
          {actionButton}

          {/* Open Pool actions */}
          {isOpenPool && instance.status === 'active' && (
            <div className="space-y-2">
              {/* Claim by dropdown */}
              <div className="relative">
                <button
                  onClick={() => setClaimDropdownOpen(!claimDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover dark:bg-bg"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Claim by
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {claimDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 z-10 mb-1 overflow-hidden rounded-lg border border-border bg-white shadow-popup dark:bg-bg">
                    {members.map((member) => (
                      <button
                        key={member.key}
                        onClick={() => handleClaim(member.key)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-hover"
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${paletteBgClasses[getMemberPaletteKey(member.key, colorMap)]}`}
                        >
                          {member.initial}
                        </div>
                        {member.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted">Assign to</span>
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className="flex-1 rounded border border-border bg-white px-2 py-1 text-xs dark:bg-bg"
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.key} value={member.key}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted">Assign by</span>
                  <select
                    value={assignBy}
                    onChange={(e) => setAssignBy(e.target.value)}
                    className="flex-1 rounded border border-border bg-white px-2 py-1 text-xs dark:bg-bg"
                    disabled={!assignTo}
                  >
                    <option value="">Select member</option>
                    {members
                      .filter((m) => m.key !== assignTo)
                      .map((member) => (
                        <option key={member.key} value={member.key}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={!assignTo || !assignBy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <User className="h-4 w-4" />
                  Assign
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onViewTemplate}
            className="flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light hover:text-primary-hover"
          >
            <Edit3 className="h-3 w-3" />
            View Template
          </button>
        </div>

        {/* Close button (top-right corner) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
