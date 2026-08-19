/**
 * ChoresView — top-level view for the chores feature.
 *
 * Fetches chores data via useChores hook, composes the ChoreBoard
 * with family members, and handles loading/error states. Manages
 * modal state for both create and edit modes.
 */

import { useState, useEffect } from 'react'
import type { ChoreInstance, FamilyMember, MasterChore } from '@/types'
import { useChores } from '@/features/chores/hooks/useChores'
import { useChoreActions } from '@/features/chores/hooks/useChoreActions'
import { ChoreBoard } from '@/features/chores/components/ChoreBoard'
import { ChoreModal } from '@/features/chores/components/ChoreModal'
import type {
  ChoreFormData,
  ChoreModalMode,
  ChoreModalInitialData,
} from '@/features/chores/components/ChoreModal'
import { colors } from '@/theme/tokens'

/** Props for the ChoresView component. */
export interface ChoresViewProps {
  /** Family members for column rendering. */
  members: FamilyMember[]
  /** When true, opens the create chore modal. Reset to false after opening. */
  openCreateModal?: boolean
  /** Callback when the create modal trigger has been consumed. */
  onCreateModalConsumed?: () => void
}

/**
 * ChoresView component.
 *
 * @param props - Component props.
 * @returns The chores view with board and modal.
 */
export function ChoresView({ members, openCreateModal, onCreateModalConsumed }: ChoresViewProps) {
  const { data, loading, error, refetch } = useChores()
  const actions = useChoreActions(refetch)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ChoreModalMode>('create')
  const [editingChore, setEditingChore] = useState<MasterChore | null>(null)
  const [editInitialData, setEditInitialData] = useState<ChoreModalInitialData | undefined>(
    undefined,
  )

  /** Open create modal when triggered from sidebar. */
  useEffect(() => {
    if (openCreateModal) {
      setModalMode('create')
      setEditingChore(null)
      setEditInitialData(undefined)
      setModalOpen(true)
      onCreateModalConsumed?.()
    }
  }, [openCreateModal, onCreateModalConsumed])

  /** Handle clicking a chore card — opens edit modal with chore data. */
  const handleChoreClick = (instance: ChoreInstance) => {
    if (!data) return
    const masterChore = data.master_chores.find((mc) => mc.id === instance.master_chore_id)
    if (!masterChore) return

    setModalMode('edit')
    setEditingChore(masterChore)
    setEditInitialData({
      name: masterChore.name,
      category_id: masterChore.category.id,
      tag_ids: masterChore.tags.map((t) => t.id),
      difficulty: masterChore.difficulty,
      frequency: masterChore.frequency,
      estimated_minutes: masterChore.estimated_minutes,
      due_time: masterChore.due_time,
      due_date: masterChore.due_date,
      expiration_behavior: masterChore.expiration_behavior,
    })
    setModalOpen(true)
  }

  /** Handle closing the modal. */
  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingChore(null)
    setEditInitialData(undefined)
  }

  /** Handle submitting the create or edit chore form. */
  const handleSubmitChore = async (formData: ChoreFormData) => {
    if (modalMode === 'edit' && editingChore) {
      await actions.updateMaster(editingChore.id, formData)
    } else {
      await actions.createMaster(formData)
    }
    handleCloseModal()
  }

  /** Handle deleting the chore being edited. */
  const handleDeleteChore = async () => {
    if (!editingChore) return
    await actions.deleteMaster(editingChore.id)
    handleCloseModal()
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.loadingText}>Loading chores...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <div style={styles.errorText}>Error loading chores: {error}</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div style={styles.container}>
      <ChoreBoard data={data} members={members} onChoreClick={handleChoreClick} />

      <ChoreModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitChore}
        categories={data.categories}
        tags={data.tags}
        onCreateCategory={actions.createCategory}
        onCreateTag={actions.createTag}
        currentMemberId={members[0]?.key ?? ''}
        mode={modalMode}
        {...(editInitialData ? { initialData: editInitialData } : {})}
        {...(modalMode === 'edit' ? { onDelete: handleDeleteChore } : {})}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: '16px',
    color: colors.textMuted,
  },
  errorText: {
    fontSize: '16px',
    color: colors.danger,
  },
}
