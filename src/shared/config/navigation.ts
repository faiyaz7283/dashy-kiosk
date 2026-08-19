/**
 * Navigation configuration — defines sidebar nav items.
 *
 * Centralizes nav item definitions so they can be easily modified
 * or loaded from an API in the future.
 */

import { Calendar, CheckSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Navigation item configuration.
 */
export interface NavItem {
  /** Display label. */
  label: string
  /** Lucide icon component. */
  icon: LucideIcon
  /** Whether this item is currently active/functional. */
  active?: boolean
}

/**
 * Sidebar navigation items.
 *
 * Currently Calendar and Chores are functional.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Calendar',
    icon: Calendar,
    active: true,
  },
  {
    label: 'Chores',
    icon: CheckSquare,
    active: true,
  },
]
