/**
 * ChoreBoard — main board layout for the chores feature.
 *
 * Two-row structure:
 * - Top row: MetricsBar (compact stats)
 * - Bottom row: Open Pool column (conditional) + member columns
 *
 * The Open Pool column only renders when there are unclaimed/unassigned
 * instances. When hidden, member columns expand to fill the space.
 */

import { useMemo } from 'react'
import type { ChoresData, ChoreInstance, FamilyMember } from '@/types'
import { isOpenPoolInstance, getMemberInstances } from '@/domain/chores/utils'
import { MetricsBar } from '@/features/chores/components/MetricsBar'
import { OpenPoolColumn } from '@/features/chores/components/OpenPoolColumn'
import { MemberColumn } from '@/features/chores/components/MemberColumn'
import { spacing } from '@/theme/tokens'

/** Props for the ChoreBoard component. */
export interface ChoreBoardProps {
  /** Complete chores data from the API. */
  data: ChoresData
  /** Family members for column rendering. */
  members: FamilyMember[]
  /** Click handler for opening chore detail modal. */
  onChoreClick?: ((instance: ChoreInstance) => void) | undefined
}

/**
 * ChoreBoard component.
 *
 * @param props - Component props.
 * @returns The chore board layout.
 */
export function ChoreBoard({ data, members, onChoreClick }: ChoreBoardProps) {
  const { instances, master_chores } = data

  /** Map of master chore ID to master chore for quick lookup. */
  const masterChoresMap = useMemo(
    () => new Map(master_chores.map((mc) => [mc.id, mc])),
    [master_chores],
  )

  /** Instances in the open pool (unclaimed and unassigned). */
  const openPoolInstances = useMemo(() => instances.filter(isOpenPoolInstance), [instances])

  /** Whether to show the open pool column. */
  const showOpenPool = openPoolInstances.length > 0

  return (
    <div style={styles.container}>
      {/* Top row: metrics */}
      <MetricsBar instances={instances} />

      {/* Bottom row: columns */}
      <div style={styles.columnsRow}>
        {showOpenPool && (
          <OpenPoolColumn
            instances={openPoolInstances}
            masterChoresMap={masterChoresMap}
            members={members}
            onChoreClick={onChoreClick}
          />
        )}
        {members.map((member) => {
          const memberInstances = getMemberInstances(instances, member.key)
          return (
            <MemberColumn
              key={member.key}
              member={member}
              instances={memberInstances}
              masterChoresMap={masterChoresMap}
              members={members}
              onChoreClick={onChoreClick}
            />
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: `${spacing.md}px`,
    overflow: 'hidden',
  },
  columnsRow: {
    display: 'flex',
    flex: 1,
    gap: `${spacing.md}px`,
    overflow: 'hidden',
  },
}
