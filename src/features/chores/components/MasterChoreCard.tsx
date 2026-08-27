/**
 * Master chore card for management views (Current Chores, Archived Chores).
 *
 * Displays a master chore template with:
 * - Checkbox for bulk selection
 * - Status badge (Active / Inactive / Archived)
 * - Labeled rows: Category, Tags, Frequency, Collab, Conditions
 * - Est. minutes + Difficulty dots
 * - Stats: association count, occurrence count
 * - Action buttons (varies by view: Edit/Pause/Archive, Edit/Restore, etc.)
 */

import { useMemo } from 'react'
import type {
  MasterChore,
  ChoreAssociation,
  ChoreCategory,
  ChoreTag,
  MasterChoreStatus,
} from '@/types/chores'
import { formatRecurrence, formatDifficulty } from '@/shared/utils/chores'
import { useConfig } from '@/shared/date'
import { DifficultyDots } from './DifficultyDots'

/** Action variant determines which buttons appear. */
export type MasterCardActionVariant = 'current' | 'archived'

/** Props for the MasterChoreCard component. */
export interface MasterChoreCardProps {
  /** The master chore to display. */
  master: MasterChore
  /** All categories for name lookup. */
  categories: ChoreCategory[]
  /** All tags for name lookup. */
  tags: ChoreTag[]
  /** All associations for counting. */
  associations: ChoreAssociation[]
  /** Whether this card is selected (checkbox). */
  isSelected: boolean
  /** Action variant — determines which buttons appear. */
  actionVariant: MasterCardActionVariant
  /** Callback when checkbox is toggled. */
  onToggleSelect: (masterId: string) => void
  /** Callback when Edit is clicked. */
  onEdit: (master: MasterChore) => void
  /** Callback when Pause/Resume is clicked (only needed for "current" variant). */
  onToggleStatus?: (master: MasterChore) => void
  /** Callback when Archive is clicked. */
  onArchive?: (master: MasterChore) => void
  /** Callback when Restore is clicked. */
  onRestore?: (master: MasterChore) => void
}

/** Status badge config — static class map. */
const statusBadgeClasses: Record<MasterChoreStatus, { container: string; dot: string }> = {
  active: {
    container: 'bg-success/10 text-success',
    dot: 'bg-success',
  },
  inactive: {
    container: 'bg-warning/10 text-warning',
    dot: 'bg-warning',
  },
  archived: {
    container: 'bg-chores-archived/10 text-text-muted',
    dot: 'bg-chores-archived',
  },
}

/** Status display labels. */
const statusLabels: Record<MasterChoreStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
}

/**
 * Master chore card for management views.
 *
 * @param props - Component props.
 * @returns The master chore card UI.
 */
export function MasterChoreCard({
  master,
  categories,
  tags,
  associations,
  isSelected,
  actionVariant,
  onToggleSelect,
  onEdit,
  onToggleStatus,
  onArchive,
  onRestore,
}: MasterChoreCardProps) {
  const { timezone } = useConfig()

  const categoryName = useMemo(
    () => categories.find((c) => c.id === master.category.id)?.name ?? 'Uncategorized',
    [categories, master.category.id],
  )

  const tagNames = useMemo(
    () =>
      master.tags
        .map((t) => tags.find((tag) => tag.id === t.id)?.name)
        .filter((name): name is string => name !== undefined),
    [master.tags, tags],
  )

  const activeAssociations = useMemo(
    () => associations.filter((a) => a.master_chore_id === master.id && a.removed_at === null),
    [associations, master.id],
  )

  const badge = statusBadgeClasses[master.status]
  const isInactive = master.status === 'inactive'
  const recurrenceSummary = formatRecurrence(master.recurrence_rule, timezone)

  const conditionsLabel = master.conditions && Object.keys(master.conditions).length > 0
    ? `${Object.keys(master.conditions).length} active`
    : 'None'

  return (
    <div
      className={`cursor-pointer rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-card-hover dark:bg-bg ${
        isInactive ? 'opacity-75' : ''
      }`}
    >
      {/* Checkbox + Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(master.id)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <h3 className="text-sm font-semibold text-text-primary">{master.name}</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.container}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          {statusLabels[master.status]}
        </span>
      </div>

      {/* Category + Tags */}
      <div className="mb-3 space-y-1.5">
        <LabeledRow label="Category">
          <span className="rounded bg-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
            {categoryName}
          </span>
        </LabeledRow>
        <LabeledRow label="Tags">
          {tagNames.length > 0 ? (
            <div className="flex gap-1">
              {tagNames.map((name) => (
                <span
                  key={name}
                  className="rounded bg-border-light px-1.5 py-0.5 text-[10px] text-text-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-text-disabled">None</span>
          )}
        </LabeledRow>
      </div>

      {/* Frequency + Collab + Conditions */}
      <div className="mb-3 space-y-1.5">
        <LabeledRow label="Frequency">
          <span className="text-text-muted">{recurrenceSummary}</span>
        </LabeledRow>
        <LabeledRow label="Collab">
          {master.is_collaborative ? (
            <span className="font-medium text-success">Yes</span>
          ) : (
            <span className="text-text-muted">No</span>
          )}
        </LabeledRow>
        <LabeledRow label="Conditions">
          {conditionsLabel === 'None' ? (
            <span className="text-text-muted">None</span>
          ) : (
            <span className="font-medium text-primary">{conditionsLabel}</span>
          )}
        </LabeledRow>
      </div>

      {/* Est. + Difficulty */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-text-muted">
          Est. {master.estimated_minutes ?? 0}m
        </div>
        <div className="flex items-center gap-2">
          <DifficultyDots level={master.difficulty} size="md" />
          <span className="text-[10px] text-text-muted">
            {formatDifficulty(master.difficulty)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-3 flex items-center gap-4 text-[10px] text-text-muted">
        <span>
          {activeAssociations.length} association{activeAssociations.length !== 1 ? 's' : ''}
        </span>
        <span>
          {master.occurrence_count} occurrence{master.occurrence_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border-light pt-3">
        <ActionButton onClick={() => onEdit(master)}>Edit</ActionButton>

        {actionVariant === 'current' && onToggleStatus && (
          <ActionButton
            onClick={() => onToggleStatus(master)}
            className={isInactive ? 'text-success hover:bg-success/10' : 'text-warning hover:bg-warning/10'}
          >
            {isInactive ? 'Resume' : 'Pause'}
          </ActionButton>
        )}

        {actionVariant === 'archived' && onRestore && (
          <ActionButton
            onClick={() => onRestore(master)}
            className="text-success hover:bg-success/10"
          >
            Restore
          </ActionButton>
        )}

        {actionVariant === 'current' && onArchive && (
          <ActionButton
            onClick={() => onArchive(master)}
            className="text-text-faint hover:text-text-muted hover:bg-bg-hover"
          >
            Archive
          </ActionButton>
        )}
      </div>
    </div>
  )
}

/** Props for the LabeledRow component. */
interface LabeledRowProps {
  /** Label text (e.g., "Category", "Tags"). */
  label: string
  /** Content to display. */
  children: React.ReactNode
}

/**
 * Labeled row with fixed-width label and content.
 *
 * @param props - Component props.
 * @returns The labeled row UI.
 */
function LabeledRow({ label, children }: LabeledRowProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-[10px] font-medium tracking-wide text-text-faint uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

/** Props for the ActionButton component. */
interface ActionButtonProps {
  /** Click handler. */
  onClick: () => void
  /** Additional CSS classes. */
  className?: string
  /** Button label. */
  children: React.ReactNode
}

/**
 * Action button for master chore card footer.
 *
 * @param props - Component props.
 * @returns The action button UI.
 */
function ActionButton({ onClick, className, children }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
        className ?? 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      }`}
    >
      {children}
    </button>
  )
}
