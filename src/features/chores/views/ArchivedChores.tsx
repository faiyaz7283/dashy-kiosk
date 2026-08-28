/**
 * ArchivedChores — management view for archived master chores.
 *
 * Displays a grid of archived master chore cards with:
 * - Archived masters only (no active or inactive)
 * - Checkbox selection for bulk actions (controlled from parent)
 * - Card actions: Edit, Restore (no Archive or Pause/Resume)
 * - No internal header (app shell header provides controls)
 */

import { useMemo } from 'react'
import { ContentCard } from '@/shared/components/ContentCard'
import { MasterChoreCard } from '../components/MasterChoreCard'
import type { ChoresData, MasterChore } from '@/types/chores'
import type { FamilyMember } from '@/types/family'

/** Props for the ArchivedChores component. */
export interface ArchivedChoresProps {
  /** Family members (for created_by lookup). */
  members: FamilyMember[]
  /** Chores data from useChoresData hook. */
  data: ChoresData | null
  /** Whether initial load is in progress. */
  isLoading: boolean
  /** Error message, if any. */
  error: string | null
  /** IDs of selected master chores. */
  selectedIds: Set<string>
  /** Callback when a master chore selection is toggled. */
  onToggleSelect: (masterId: string) => void
  /** Callback when Edit is clicked. */
  onEditMaster: (master: MasterChore) => void
  /** Callback when Restore is clicked. */
  onRestore: (master: MasterChore) => void
  /** Callback when Delete Permanently is clicked. */
  onDelete?: (master: MasterChore) => void
}

/**
 * Archived Chores management view.
 *
 * @param props - Component props.
 * @returns The archived chores view UI.
 */
export function ArchivedChores({
  data,
  isLoading,
  error,
  selectedIds,
  onToggleSelect,
  onEditMaster,
  onRestore,
  onDelete,
}: ArchivedChoresProps) {
  const archivedMasters = useMemo(() => {
    if (!data) return []
    return data.master_chores.filter((m) => m.status === 'archived')
  }, [data])

  if (isLoading) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading chores...</p>
        </div>
      </ContentCard>
    )
  }

  if (error) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-danger">Error loading chores: {error}</p>
        </div>
      </ContentCard>
    )
  }

  if (!data) {
    return null
  }

  return (
    <ContentCard>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Master chore grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {archivedMasters.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-text-muted">No archived chores found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedMasters.map((master) => (
                <MasterChoreCard
                  key={master.id}
                  master={master}
                  categories={data.categories}
                  tags={data.tags}
                  associations={data.associations}
                  isSelected={selectedIds.has(master.id)}
                  actionVariant="archived"
                  onToggleSelect={onToggleSelect}
                  onEdit={onEditMaster}
                  onRestore={onRestore}
                  {...(onDelete ? { onDelete } : {})}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentCard>
  )
}
