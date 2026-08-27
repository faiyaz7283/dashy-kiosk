/**
 * ChoresView — top-level orchestrator for the chores feature.
 *
 * Routes to the correct sub-view based on viewMode:
 * - board → ChoresBoard
 * - manage-current → CurrentChores
 * - manage-archived → ArchivedChores
 *
 * Also renders MasterChoreModal when triggered (create or edit).
 * State and actions are managed by the parent (AppShell).
 */

import { ChoresBoard } from './ChoresBoard'
import { CurrentChores } from './CurrentChores'
import { ArchivedChores } from './ArchivedChores'
import { MasterChoreModal } from '../components/MasterChoreModal'
import type { ChoresViewMode } from '@/features/shell/HeaderChores'
import type { ChoresData, MasterChore } from '@/types/chores'
import type { FamilyMember } from '@/types/family'

/** Props for the ChoresView component. */
export interface ChoresViewProps {
  /** Family members for board columns and modal. */
  members: FamilyMember[]
  /** Current chores view mode. */
  viewMode: ChoresViewMode
  /** Chores data from useChoresData hook. */
  data: ChoresData | null
  /** Whether initial load is in progress. */
  isLoading: boolean
  /** Error message, if any. */
  error: string | null
  /** IDs of selected master chores. */
  selectedIds: Set<string>
  /** Callback to toggle selection of a master chore. */
  onToggleSelect: (masterId: string) => void
  /** Callback when Edit is clicked on a master chore card. */
  onEditMaster: (master: MasterChore) => void
  /** Callback when Pause/Resume is clicked on a master chore card. */
  onToggleStatus: (master: MasterChore) => void
  /** Callback when Archive is clicked on a master chore card. */
  onArchive: (master: MasterChore) => void
  /** Callback when Restore is clicked on a master chore card. */
  onRestore: (master: MasterChore) => void
  /** Whether the master chore modal is open. */
  showMasterModal: boolean
  /** The master chore being edited (null for create mode). */
  editingMaster: MasterChore | null
  /** Callback to close the master chore modal. */
  onCloseMasterModal: () => void
  /** Callback after successful master create/update. */
  onMasterSuccess: () => void
  /** Callback to refetch chores data. */
  refetch: () => void
}

/**
 * Chores view orchestrator — routes to sub-views and renders modal.
 *
 * @param props - Component props.
 * @returns The chores view UI.
 */
export function ChoresView({
  members,
  viewMode,
  data,
  isLoading,
  error,
  selectedIds,
  onToggleSelect,
  onEditMaster,
  onToggleStatus,
  onArchive,
  onRestore,
  showMasterModal,
  editingMaster,
  onCloseMasterModal,
  onMasterSuccess,
  refetch,
}: ChoresViewProps) {
  return (
    <>
      {viewMode === 'board' && (
        <ChoresBoard
          members={members}
          data={data}
          isLoading={isLoading}
          isRefreshing={false}
          error={error}
        />
      )}

      {viewMode === 'manage-current' && (
        <CurrentChores
          members={members}
          data={data}
          isLoading={isLoading}
          error={error}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onEditMaster={onEditMaster}
          onToggleStatus={onToggleStatus}
          onArchive={onArchive}
        />
      )}

      {viewMode === 'manage-archived' && (
        <ArchivedChores
          members={members}
          data={data}
          isLoading={isLoading}
          error={error}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onEditMaster={onEditMaster}
          onRestore={onRestore}
        />
      )}

      {showMasterModal && data && (
        <MasterChoreModal
          mode={editingMaster ? 'edit' : 'create'}
          {...(editingMaster ? { master: editingMaster } : {})}
          categories={data.categories}
          tags={data.tags}
          members={members}
          onClose={onCloseMasterModal}
          onSuccess={onMasterSuccess}
          refetch={refetch}
        />
      )}
    </>
  )
}
