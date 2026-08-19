/**
 * ChoreCard — presentational component for a single chore instance.
 *
 * Displays chore name, category badge, tags, difficulty indicator,
 * time info, status badge, and attribution. Compact design to fit
 * many cards in a column.
 */

import { useState } from 'react'
import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'
import { getStatusColor, getStatusLabel } from '@/domain/chores/utils'
import { getMemberColorPalette } from '@/shared/utils/memberColors'
import { colors, spacing, radii, typography } from '@/theme/tokens'

/** Props for the ChoreCard component. */
export interface ChoreCardProps {
  /** The chore instance to display. */
  instance: ChoreInstance
  /** The master chore template (for name, category, tags, difficulty). */
  masterChore: MasterChore
  /** Family members for resolving names and initials. */
  members: FamilyMember[]
  /** Click handler for opening detail modal. */
  onClick?: ((instance: ChoreInstance) => void) | undefined
}

/**
 * Resolves a member key to a display name.
 *
 * @param memberKey - The member key to resolve.
 * @param members - Available family members.
 * @returns The member's display name, or "Unknown".
 */
function resolveMemberName(memberKey: string | null, members: FamilyMember[]): string {
  if (!memberKey) return ''
  const member = members.find((m) => m.key === memberKey)
  return member?.name ?? 'Unknown'
}

/**
 * Resolves the primary member key for an instance (for color coding).
 *
 * Priority: completed_by \> claimed_by \> assigned_to.
 *
 * @param instance - The chore instance.
 * @returns The member key of the primary actor, or null.
 */
function resolvePrimaryMemberKey(instance: ChoreInstance): string | null {
  return instance.completed_by ?? instance.claimed_by ?? instance.assigned_to
}

/**
 * Renders difficulty dots (1–5).
 *
 * @param level - Difficulty level (1–5).
 * @returns Array of dot elements.
 */
function DifficultyDots({ level }: { level: number }) {
  return (
    <span style={styles.difficultyRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            ...styles.dot,
            background: i < level ? colors.choresInProgress : colors.border,
          }}
        />
      ))}
    </span>
  )
}

/**
 * ChoreCard component.
 *
 * @param props - Component props.
 * @returns The chore card UI.
 */
export function ChoreCard({ instance, masterChore, members, onClick }: ChoreCardProps) {
  const [hovered, setHovered] = useState(false)

  const statusColor = getStatusColor(instance.status)
  const statusLabel = getStatusLabel(instance.status)

  // Resolve member color for the left border
  const primaryMemberKey = resolvePrimaryMemberKey(instance)
  const primaryMember = primaryMemberKey
    ? members.find((m) => m.key === primaryMemberKey)
    : undefined
  const memberPalette = primaryMember ? getMemberColorPalette(primaryMember.color) : undefined
  const borderColor = memberPalette?.avatar ?? colors.border

  const attribution = (() => {
    if (instance.completed_by) {
      return `Completed by ${resolveMemberName(instance.completed_by, members)}`
    }
    if (instance.claimed_by) {
      return `Claimed by ${resolveMemberName(instance.claimed_by, members)}`
    }
    if (instance.assigned_to) {
      const assigner = resolveMemberName(instance.assigned_by, members)
      const assignee = resolveMemberName(instance.assigned_to, members)
      return assigner ? `Assigned by ${assigner} to ${assignee}` : `Assigned to ${assignee}`
    }
    return 'Unclaimed'
  })()

  const handleClick = () => {
    onClick?.(instance)
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        borderLeftColor: borderColor,
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Header: name + status badge */}
      <div style={styles.header}>
        <span style={styles.name}>{masterChore.name}</span>
        <span
          style={{
            ...styles.statusBadge,
            background: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Category + tags row */}
      <div style={styles.metaRow}>
        <span style={styles.categoryBadge}>{masterChore.category.name}</span>
        {masterChore.tags.map((tag) => (
          <span key={tag.id} style={styles.tagChip}>
            {tag.name}
          </span>
        ))}
      </div>

      {/* Difficulty + time row */}
      <div style={styles.metaRow}>
        <DifficultyDots level={masterChore.difficulty} />
        {masterChore.estimated_minutes !== null && (
          <span style={styles.timeText}>{masterChore.estimated_minutes}m</span>
        )}
        {masterChore.due_time && <span style={styles.timeText}>Due: {masterChore.due_time}</span>}
      </div>

      {/* Attribution */}
      <div style={styles.attribution}>{attribution}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: `${radii.lg}px`,
    padding: `${spacing.md}px`,
    background: colors.bgHover,
    borderLeft: `3px solid ${colors.border}`,
    transition: 'transform 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.xs}px`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${spacing.sm}px`,
  },
  name: {
    fontSize: `${typography.eventTitle.size}px`,
    fontWeight: typography.eventTitle.weight,
    color: colors.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: colors.white,
    padding: '2px 6px',
    borderRadius: `${radii.full}px`,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.xs}px`,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.textSecondary,
    background: colors.border,
    padding: '1px 6px',
    borderRadius: `${radii.sm}px`,
  },
  tagChip: {
    fontSize: '9px',
    fontWeight: 400,
    color: colors.textMuted,
    background: colors.borderLight,
    padding: '1px 4px',
    borderRadius: `${radii.sm}px`,
  },
  difficultyRow: {
    display: 'inline-flex',
    gap: '2px',
    alignItems: 'center',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  timeText: {
    fontSize: '10px',
    color: colors.textMuted,
  },
  attribution: {
    fontSize: '10px',
    color: colors.textFaint,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
