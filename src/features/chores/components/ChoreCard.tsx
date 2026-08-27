/**
 * Chore card component for the board columns.
 *
 * Displays a single chore instance with status-colored left border,
 * title, category tag, frequency, difficulty dots, estimated time,
 * assignment info, and action button (Start/Complete).
 */

import { Clock, AlertTriangle, CheckCircle, Play, Archive } from 'lucide-react'
import type { ChoreInstance, MasterChore, ChoreCategory, InstanceStatus } from '@/types/chores'
import { paletteBorderClasses, getMemberPaletteKey, type PaletteKey } from '@/shared/utils/memberColors'
import { formatUtcTimeOfDay, useConfig } from '@/shared/date'
import { getStatusLabel } from '@/shared/utils/chores'

/** Props for the ChoreCard component. */
export interface ChoreCardProps {
  /** The chore instance to display. */
  instance: ChoreInstance
  /** The parent master chore template. */
  masterChore: MasterChore
  /** All available categories. */
  categories: ChoreCategory[]
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Callback when the card is clicked. */
  onClick?: () => void
  /** Callback when Start button is clicked. */
  onStart?: () => void
  /** Callback when Complete button is clicked. */
  onComplete?: () => void
}

/** Static map for status icon colors. */
const statusIconClasses: Record<InstanceStatus, string> = {
  active: 'bg-chores-active',
  in_progress: 'bg-chores-in-progress',
  completed: 'bg-chores-completed',
  overdue: 'bg-chores-overdue',
  missed: 'bg-chores-missed',
  archived: 'bg-chores-archived',
}

/**
 * Get the status icon component.
 */
function getStatusIcon(status: InstanceStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-2.5 w-2.5" />
    case 'in_progress':
      return <Play className="h-2.5 w-2.5" />
    case 'overdue':
    case 'missed':
      return <AlertTriangle className="h-2.5 w-2.5" />
    case 'archived':
      return <Archive className="h-2.5 w-2.5" />
    default:
      return <Clock className="h-2.5 w-2.5" />
  }
}

/**
 * Chore card for board columns.
 *
 * @param props - Component props.
 * @returns The chore card UI.
 */
export function ChoreCard({
  instance,
  masterChore,
  categories,
  colorMap,
  onClick,
  onStart,
  onComplete,
}: ChoreCardProps) {
  const { timezone } = useConfig()

  // Get category name
  const category = categories.find((c) => c.id === masterChore.category.id)
  const categoryName = category?.name ?? 'Uncategorized'

  // Get member color for left border
  const memberKey = instance.claimed_by ?? instance.assigned_to
  const paletteKey = getMemberPaletteKey(memberKey, colorMap)

  // Difficulty dots (filled = active, empty = inactive)
  const difficultyDots = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`h-1 w-1 rounded-full ${
        i < masterChore.difficulty ? 'bg-chores-in-progress' : 'bg-border'
      }`}
    />
  ))

  // Format assignment text
  const getAssignmentText = () => {
    if (instance.status === 'completed') {
      return `Completed by ${instance.completed_by ?? 'Unknown'}`
    }
    if (instance.claimed_by) {
      return `Claimed by ${instance.claimed_by}`
    }
    if (instance.assigned_to) {
      return `Assigned by ${instance.assigned_by ?? 'Unknown'} to ${instance.assigned_to}`
    }
    return 'Unclaimed'
  }

  // Format due time
  const formattedDueTime = masterChore.due_time
    ? formatUtcTimeOfDay(masterChore.due_time, timezone)
    : null

  // Determine action button
  const getActionButton = () => {
    if (instance.status === 'active') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStart?.()
          }}
          className="w-full rounded py-1 px-2 text-[10px] font-medium text-white bg-chores-active hover:bg-chores-active/90 transition-colors"
        >
          Start
        </button>
      )
    }
    if (instance.status === 'in_progress') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onComplete?.()
          }}
          className="w-full rounded py-1 px-2 text-[10px] font-medium text-white bg-chores-completed hover:bg-chores-completed/90 transition-colors"
        >
          Complete
        </button>
      )
    }
    return null
  }

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border-l-4 ${paletteBorderClasses[paletteKey]} bg-white p-2.5 hover:bg-bg-hover transition-colors dark:bg-bg`}
    >
      {/* Title and status icon */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-text-primary">
          {masterChore.name}
        </span>
        <span
          className={`shrink-0 rounded-full p-0.5 text-white ${statusIconClasses[instance.status]}`}
          title={getStatusLabel(instance.status)}
        >
          {getStatusIcon(instance.status)}
        </span>
      </div>

      {/* Category and frequency */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="rounded bg-border px-1 py-0.5 text-[9px] font-medium text-text-secondary">
          {categoryName}
        </span>
        <span className="rounded bg-border-light px-1 py-0.5 text-[8px] text-text-muted">
          {masterChore.recurrence_rule?.frequency ?? 'once'}
        </span>
      </div>

      {/* Difficulty dots, estimated time, and due time */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex gap-0.5">{difficultyDots}</div>
        {masterChore.estimated_minutes && (
          <span className="text-[9px] text-text-muted">
            {masterChore.estimated_minutes}m
          </span>
        )}
        {formattedDueTime && (
          <span className="text-[9px] text-text-muted">
            Due: {formattedDueTime}
          </span>
        )}
      </div>

      {/* Assignment info */}
      <div className="mb-1.5 text-[9px] text-text-faint">{getAssignmentText()}</div>

      {/* Action button */}
      {getActionButton()}
    </div>
  )
}
