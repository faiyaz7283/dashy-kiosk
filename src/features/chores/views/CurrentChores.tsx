/**
 * Current Chores view — management interface for active and inactive master chores.
 *
 * Displays a grid of master chore cards with:
 * - Active and Inactive (paused) masters only (no archived)
 * - Checkbox selection for bulk actions
 * - Card actions: Edit, Pause/Resume, Archive
 * - No internal header (app shell header provides controls)
 */

import { useMemo, useState } from 'react'
import { ContentCard } from '@/shared/components/ContentCard'
import { MasterChoreCard } from '../components/MasterChoreCard'
import type {
  ChoresData,
  MasterChore,
} from '@/types/chores'
import type { FamilyMember } from '@/types/family'

/** Props for the CurrentChores component. */
export interface CurrentChoresProps {
  /** Family members (for created_by lookup). */
  members: FamilyMember[]
  /** Chores data from useChoresData hook. */
  data: ChoresData | null
  /** Whether initial load is in progress. */
  isLoading: boolean
  /** Error message, if any. */
  error: string | null
  /** Callback when Edit is clicked. */
  onEditMaster: (master: MasterChore) => void
  /** Callback when Pause/Resume is clicked. */
  onToggleStatus: (master: MasterChore) => void
  /** Callback when Archive is clicked. */
  onArchive: (master: MasterChore) => void
}

/**
 * Current Chores management view.
 *
 * @param props - Component props.
 * @returns The current chores view UI.
 */
export function CurrentChores({
  data,
  isLoading,
  error,
  onEditMaster,
  onToggleStatus,
  onArchive,
}: CurrentChoresProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter to active + inactive masters only
  const currentMasters = useMemo(() => {
    if (!data) return []
    return data.master_chores.filter(
      (m) => m.status === 'active' || m.status === 'inactive',
    )
  }, [data])

  const handleToggleSelect = (masterId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(masterId)) {
        next.delete(masterId)
      } else {
        next.add(masterId)
      }
      return next
    })
  }

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
          {currentMasters.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-text-muted">No chores found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentMasters.map((master) => (
                <MasterChoreCard
                  key={master.id}
                  master={master}
                  categories={data.categories}
                  tags={data.tags}
                  associations={data.associations}
                  isSelected={selectedIds.has(master.id)}
                  actionVariant="current"
                  onToggleSelect={handleToggleSelect}
                  onEdit={onEditMaster}
                  onToggleStatus={onToggleStatus}
                  onArchive={onArchive}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentCard>
  )
}
