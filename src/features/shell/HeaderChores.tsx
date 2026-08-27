/**
 * HeaderChores — chores-specific header controls.
 *
 * Renders the RIGHT section of the header when the chores feature is active:
 * - View toggle: Board | Manage Current | Manage Archived
 * - Select All (manage views only)
 * - Context-aware bulk actions per view
 * - Create Master button (always visible)
 *
 * The LEFT section (date, clock, weather) is handled by HeaderLeft in the parent.
 */

import { Plus } from 'lucide-react'

/** Available chores view modes. */
export type ChoresViewMode = 'board' | 'manage-current' | 'manage-archived'

/** View toggle option config. */
const VIEW_OPTIONS: { value: ChoresViewMode; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'manage-current', label: 'Manage Current' },
  { value: 'manage-archived', label: 'Manage Archived' },
]

/** Props for the HeaderChores component. */
export interface HeaderChoresProps {
  /** Current chores view mode. */
  viewMode: ChoresViewMode
  /** Callback when view mode changes. */
  onViewChange: (mode: ChoresViewMode) => void
  /** Number of currently selected master chores. */
  selectedCount: number
  /** Callback when Select All is clicked. */
  onSelectAll: () => void
  /** Callback when Pause Selected is clicked. */
  onPauseSelected: () => void
  /** Callback when Archive Selected is clicked. */
  onArchiveSelected: () => void
  /** Callback when Restore Selected is clicked. */
  onRestoreSelected: () => void
  /** Callback when Delete Selected is clicked. */
  onDeleteSelected: () => void
  /** Callback when Create Master is clicked. */
  onCreateMaster: () => void
}

/**
 * Chores header controls with view toggle, bulk actions, and create button.
 *
 * @param props - Header configuration and callbacks.
 * @returns The chores header controls UI.
 */
export function HeaderChores({
  viewMode,
  onViewChange,
  selectedCount,
  onSelectAll,
  onPauseSelected,
  onArchiveSelected,
  onRestoreSelected,
  onDeleteSelected,
  onCreateMaster,
}: HeaderChoresProps) {
  const hasSelection = selectedCount > 0
  const isManageView = viewMode !== 'board'

  return (
    <div className="flex items-center gap-3">
      {/* View toggle: Board | Manage Current | Manage Archived */}
      <div className="flex items-center rounded-lg bg-bg-hover p-0.5">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onViewChange(option.value)}
            className={
              viewMode === option.value
                ? 'rounded-md bg-white px-3 py-1.5 text-xs font-medium text-primary shadow-view-btn'
                : 'rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary'
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Select All — manage views only */}
      {isManageView && (
        <button
          onClick={onSelectAll}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover"
        >
          Select All
        </button>
      )}

      {/* Bulk actions — Manage Current */}
      {viewMode === 'manage-current' && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPauseSelected}
            disabled={!hasSelection}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Pause Selected
          </button>
          <button
            onClick={onArchiveSelected}
            disabled={!hasSelection}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-faint transition-colors hover:bg-bg-hover disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Archive Selected
          </button>
        </div>
      )}

      {/* Bulk actions — Manage Archived */}
      {viewMode === 'manage-archived' && (
        <div className="flex items-center gap-2">
          <button
            onClick={onRestoreSelected}
            disabled={!hasSelection}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Restore Selected
          </button>
          <button
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Delete Permanently
          </button>
        </div>
      )}

      {/* Create Master button (primary action) */}
      <button
        onClick={onCreateMaster}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        <Plus className="h-3.5 w-3.5" />
        Create Master
      </button>
    </div>
  )
}
