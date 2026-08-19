/**
 * OpenPoolColumn — column displaying unclaimed/unassigned chore instances.
 *
 * Conditionally rendered by ChoreBoard only when there are open pool
 * instances. Shows a header with count badge and a scrollable list
 * of ChoreCards.
 */

import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'
import { ChoreCard } from '@/features/chores/components/ChoreCard'
import { colors, spacing, radii, typography } from '@/theme/tokens'

/** Props for the OpenPoolColumn component. */
export interface OpenPoolColumnProps {
  /** Open pool instances (unclaimed and unassigned). */
  instances: ChoreInstance[]
  /** Master chores lookup (keyed by master_chore_id). */
  masterChoresMap: Map<string, MasterChore>
  /** Family members for resolving names. */
  members: FamilyMember[]
  /** Click handler for opening chore detail modal. */
  onChoreClick?: ((instance: ChoreInstance) => void) | undefined
}

/**
 * OpenPoolColumn component.
 *
 * @param props - Component props.
 * @returns The open pool column UI.
 */
export function OpenPoolColumn({
  instances,
  masterChoresMap,
  members,
  onChoreClick,
}: OpenPoolColumnProps) {
  return (
    <div style={styles.column}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Open Pool</span>
        <span style={styles.badge}>{instances.length}</span>
      </div>
      <div style={styles.cardList}>
        {instances.map((instance) => {
          const master = masterChoresMap.get(instance.master_chore_id)
          if (!master) return null
          return (
            <ChoreCard
              key={instance.id}
              instance={instance}
              masterChore={master}
              members={members}
              onClick={onChoreClick}
            />
          )
        })}
        {instances.length === 0 && <div style={styles.emptyText}>No open chores</div>}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  column: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    background: colors.bgHover,
    borderRadius: `${radii.xl}px`,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.border}`,
  },
  headerTitle: {
    fontSize: `${typography.dayCardSubtext.size + 2}px`,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  badge: {
    fontSize: `${typography.badge.size}px`,
    fontWeight: typography.badge.weight,
    color: colors.white,
    background: colors.choresOpen,
    padding: '2px 8px',
    borderRadius: `${radii.full}px`,
  },
  cardList: {
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing.sm}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.sm}px`,
  },
  emptyText: {
    fontSize: `${typography.dayCardSubtext.size}px`,
    color: colors.textFaint,
    textAlign: 'center',
    padding: `${spacing.xl}px`,
  },
}
