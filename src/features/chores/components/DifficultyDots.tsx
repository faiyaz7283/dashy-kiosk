/**
 * Difficulty dots component — visual indicator of chore difficulty.
 *
 * Renders 5 dots with filled/empty states based on difficulty level.
 * Used in ChoreCard (board), AssociationPickerModal (picker), and
 * MasterChoreCard (management views).
 */

/** Props for the DifficultyDots component. */
export interface DifficultyDotsProps {
  /** Difficulty level (1–5). */
  level: number
  /** Size variant — 'sm' for board cards, 'md' for picker/management cards. */
  size?: 'sm' | 'md'
}

/** Size class map for dots. */
const sizeClasses = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
} as const

/**
 * Renders 5 difficulty dots with filled/empty states.
 *
 * @param props - Component props.
 * @returns The difficulty dots UI.
 */
export function DifficultyDots({ level, size = 'sm' }: DifficultyDotsProps) {
  const dotSize = sizeClasses[size]

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`rounded-full ${dotSize} ${
            i < level ? 'bg-chores-in-progress' : 'bg-border'
          }`}
        />
      ))}
    </div>
  )
}
