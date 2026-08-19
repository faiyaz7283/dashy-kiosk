/**
 * MetricsBar — compact metrics row at the top of the chore board.
 *
 * Displays key stats: total active, completed today, overdue, unclaimed.
 * Designed to be compact; future enhancement may add collapsible detail.
 */

import type { ChoreInstance } from '@/types'
import { isOpenPoolInstance } from '@/domain/chores/utils'
import { colors, spacing, radii, typography } from '@/theme/tokens'

/** Props for the MetricsBar component. */
export interface MetricsBarProps {
  /** All active chore instances. */
  instances: ChoreInstance[]
}

/**
 * MetricsBar component.
 *
 * @param props - Component props.
 * @returns The metrics bar UI.
 */
export function MetricsBar({ instances }: MetricsBarProps) {
  const totalActive = instances.length
  const completedToday = instances.filter((i) => i.status === 'completed').length
  const overdue = instances.filter((i) => i.status === 'overdue').length
  const unclaimed = instances.filter(isOpenPoolInstance).length

  const metrics = [
    { label: 'Active', value: totalActive, color: colors.choresOpen },
    { label: 'Completed', value: completedToday, color: colors.choresCompleted },
    { label: 'Overdue', value: overdue, color: colors.choresOverdue },
    { label: 'Unclaimed', value: unclaimed, color: colors.choresClaimed },
  ]

  return (
    <div style={styles.container}>
      {metrics.map((metric) => (
        <div key={metric.label} style={styles.metric}>
          <span style={{ ...styles.value, color: metric.color }}>{metric.value}</span>
          <span style={styles.label}>{metric.label}</span>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.xl}px`,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    background: colors.bgHover,
    borderRadius: `${radii.lg}px`,
    borderBottom: `1px solid ${colors.border}`,
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.xs}px`,
  },
  value: {
    fontSize: `${typography.dayCardSubtext.size + 2}px`,
    fontWeight: 700,
  },
  label: {
    fontSize: `${typography.dayCardSubtext.size}px`,
    color: colors.textMuted,
    fontWeight: 400,
  },
}
