/**
 * MemberColumn — column displaying a family member's chore instances.
 *
 * Shows a header with member name, avatar initial, and count badge.
 * Renders a scrollable list of ChoreCards for claimed/assigned instances.
 */

import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'
import { ChoreCard } from '@/features/chores/components/ChoreCard'
import { colors, spacing, radii, typography } from '@/theme/tokens'

/** Props for the MemberColumn component. */
export interface MemberColumnProps {
  /** The family member this column represents. */
  member: FamilyMember
  /** Chore instances belonging to this member. */
  instances: ChoreInstance[]
  /** Master chores lookup (keyed by master_chore_id). */
  masterChoresMap: Map<string, MasterChore>
  /** All family members for resolving names. */
  members: FamilyMember[]
  /** Click handler for opening chore detail modal. */
  onChoreClick?: ((instance: ChoreInstance) => void) | undefined
}

/**
 * MemberColumn component.
 *
 * @param props - Component props.
 * @returns The member column UI.
 */
export function MemberColumn({
  member,
  instances,
  masterChoresMap,
  members,
  onChoreClick,
}: MemberColumnProps) {
  return (
    <div style={styles.column}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span
            style={{
              ...styles.avatar,
              backgroundColor: member.color,
            }}
          >
            {member.initial}
          </span>
          <span style={styles.headerTitle}>{member.name}</span>
        </div>
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
        {instances.length === 0 && <div style={styles.emptyText}>No chores</div>}
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.sm}px`,
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    fontSize: '11px',
    fontWeight: 700,
    color: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    background: colors.primary,
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
