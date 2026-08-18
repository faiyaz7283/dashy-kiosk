/**
 * Navigation configuration — defines sidebar nav items.
 *
 * Centralizes nav item definitions so they can be easily modified
 * or loaded from an API in the future.
 */

import { Calendar, CheckSquare, Star, BookOpen, Image, List } from 'lucide-react'
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
 * Currently only Calendar is functional. Other items are placeholders
 * for future features.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Calendar',
    icon: Calendar,
    active: true,
  },
  {
    label: 'Tasks',
    icon: CheckSquare,
    active: false,
  },
  {
    label: 'Rewards',
    icon: Star,
    active: false,
  },
  {
    label: 'Meals',
    icon: BookOpen,
    active: false,
  },
  {
    label: 'Photos',
    icon: Image,
    active: false,
  },
  {
    label: 'Lists',
    icon: List,
    active: false,
  },
]
