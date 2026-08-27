/**
 * Tooltip component for displaying help text on hover.
 *
 * Wraps a trigger element and shows a tooltip popup on hover.
 * Uses Tailwind CSS for styling and follows the project's design tokens.
 */

import { useState, type ReactNode } from 'react'

/** Props for the Tooltip component. */
export interface TooltipProps {
  /** The content to show in the tooltip. */
  content: string
  /** The trigger element (usually an icon or text). */
  children: ReactNode
  /** Position of the tooltip relative to the trigger. */
  position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Tooltip component that shows help text on hover.
 *
 * @param props - Component props.
 * @returns The tooltip UI.
 */
export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 whitespace-nowrap rounded-md bg-bg px-2 py-1 text-xs text-text-primary shadow-lg ring-1 ring-border ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
