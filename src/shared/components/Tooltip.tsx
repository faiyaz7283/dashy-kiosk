/**
 * Tooltip component for displaying help text on hover.
 *
 * Renders the tooltip popup via a portal to document.body, avoiding
 * clipping from ancestor overflow:hidden containers (e.g., modals).
 * Uses position: absolute on body (outside any transform ancestors)
 * with viewport-relative coordinates from getBoundingClientRect().
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Tooltip placement relative to the trigger element. */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

/** Props for the Tooltip component. */
export interface TooltipProps {
  /** The content to show in the tooltip. */
  content: string
  /** The trigger element (usually an icon or text). */
  children: ReactNode
  /** Preferred position of the tooltip relative to the trigger. */
  position?: TooltipPosition
  /** Gap in pixels between the trigger and the tooltip. */
  gap?: number
}

/** Gap between trigger and tooltip (default 6px). */
const DEFAULT_GAP = 6

/**
 * Tooltip component that portals to document.body to avoid clipping.
 *
 * Uses absolute positioning on body with viewport-relative coordinates.
 * Automatically flips to alternative positions if the preferred one
 * would overflow the viewport.
 *
 * @param props - Component props.
 * @returns The tooltip trigger with a portalled popup on hover.
 */
export function Tooltip({
  content,
  children,
  position: preferredPosition = 'top',
  gap = DEFAULT_GAP,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [resolvedPosition, setResolvedPosition] = useState(preferredPosition)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  /** Compute tooltip position based on trigger rect and tooltip size. */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Check which positions fit within the viewport.
    const fits = {
      top: triggerRect.top - tooltipRect.height - gap >= 0,
      bottom: triggerRect.bottom + tooltipRect.height + gap <= viewport.height,
      left: triggerRect.left - tooltipRect.width - gap >= 0,
      right: triggerRect.right + tooltipRect.width + gap <= viewport.width,
    }

    // Use preferred position if it fits, otherwise pick the first fallback.
    let chosen: TooltipPosition = preferredPosition
    if (!fits[preferredPosition]) {
      const fallbacks: TooltipPosition[] = ['top', 'bottom', 'right', 'left']
      chosen = fallbacks.find((p) => fits[p]) ?? preferredPosition
    }

    setResolvedPosition(chosen)

    // Compute viewport-relative coordinates.
    let top: number = 0
    let left: number = 0

    switch (chosen) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        break
      case 'bottom':
        top = triggerRect.bottom + gap
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        break
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.left - tooltipRect.width - gap
        break
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.right + gap
        break
      default:
        top = triggerRect.bottom + gap
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
    }

    // Clamp to viewport edges with 8px margin.
    const margin = 8
    left = Math.max(margin, Math.min(left, viewport.width - tooltipRect.width - margin))
    top = Math.max(margin, Math.min(top, viewport.height - tooltipRect.height - margin))

    setCoords({ top, left })
  }, [preferredPosition, gap])

  // Reposition when visibility changes or window resizes/scrolls.
  useEffect(() => {
    if (!isVisible) return

    // Small delay to ensure tooltip is rendered and measurable.
    const timer = setTimeout(updatePosition, 0)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isVisible, updatePosition])

  const arrowPositionClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-px',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-px',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-px',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-px',
  }

  const tooltip = isVisible ? (
    <div
      ref={tooltipRef}
      className="pointer-events-none"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
      }}
    >
      <div className="rounded-md bg-bg px-2.5 py-1.5 text-xs leading-relaxed text-text-primary shadow-lg ring-1 ring-border max-w-[280px]">
        {content}
        {/* Small arrow pointing at the trigger */}
        <div
          className={`absolute h-1.5 w-1.5 rotate-45 bg-bg ring-1 ring-border ${arrowPositionClasses[resolvedPosition]}`}
          style={{
            borderTop: resolvedPosition === 'bottom' ? 'none' : undefined,
            borderLeft: resolvedPosition === 'right' ? 'none' : undefined,
            borderBottom: resolvedPosition === 'top' ? 'none' : undefined,
            borderRight: resolvedPosition === 'left' ? 'none' : undefined,
          }}
        />
      </div>
    </div>
  ) : null

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {createPortal(tooltip, document.body)}
    </>
  )
}
