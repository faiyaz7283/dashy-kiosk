/**
 * ChoresView — top-level view for the chores feature.
 *
 * Fetches chores data via useChores hook, composes the ChoreBoard
 * with family members, and handles loading/error states.
 */

import { useState } from 'react'
import type { ChoreInstance, FamilyMember } from '@/types'
import { useChores } from '@/features/chores/hooks/useChores'
import { useChoreActions } from '@/features/chores/hooks/useChoreActions'
import { ChoreBoard } from '@/features/chores/components/ChoreBoard'
import { ChoreModal } from '@/features/chores/components/ChoreModal'
import type { ChoreFormData } from '@/features/chores/components/ChoreModal'
import { colors } from '@/theme/tokens'

/** Props for the ChoresView component. */
export interface ChoresViewProps {
  /** Family members for column rendering. */
  members: FamilyMember[]
}

/**
 * ChoresView component.
 *
 * @param props - Component props.
 * @returns The chores view with board and modal.
 */
export function ChoresView({ members }: ChoresViewProps) {
  const { data, loading, error, refetch } = useChores()
  const actions = useChoreActions(refetch)

  const [modalOpen, setModalOpen] = useState(false)

  /** Handle clicking a chore card — opens modal with instance details. */
  const handleChoreClick = (_instance: ChoreInstance) => {
    setModalOpen(true)
  }

  /** Handle closing the modal. */
  const handleCloseModal = () => {
    setModalOpen(false)
  }

  /** Handle submitting the create chore form. */
  const handleSubmitChore = async (formData: ChoreFormData) => {
    await actions.createMaster(formData)
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
