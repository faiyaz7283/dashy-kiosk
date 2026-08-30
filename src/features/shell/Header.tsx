/**
 * Header component — top bar with feature-aware content.
 *
 * Displays:
 * - LEFT: Date + Clock + Weather (shared via HeaderLeft, all features)
 * - CENTER: Calendar → family pills with event counts; Chores → empty
 * - RIGHT: Calendar → view switcher + Today; Chores → view toggle + bulk actions
 *
 * The header is positioned absolutely on the top edge and overlays the content area.
 * Auto-hide behavior is managed by the parent AppShell via useAutoHide.
 */

import { Calendar } from 'lucide-react'
import { ViewSwitcher } from './ViewSwitcher'
import { HeaderLeft } from './HeaderLeft'
import { HeaderChores, type ChoresViewMode } from './HeaderChores'
import type { CalendarView } from '@/types/calendar'
import type { CalendarEvent } from '@/types/calendar'
import type { Feature } from './Sidebar'
import {
  paletteBgClasses,
  paletteBgOpacityClasses,
  paletteTextClasses,
  paletteRingClasses,
  resolvePaletteKey,
} from '@/shared/utils/memberColors'
import type { FamilyMember } from '@/types/family'

/** Props for the Header component. */
export interface HeaderProps {
  /** The currently active feature (calendar or chores). */
  activeFeature: Feature
  /** The currently active calendar view. */
  currentView: CalendarView
  /** Callback when the calendar view changes. */
  onViewChange: (view: CalendarView) => void
  /** Callback when Today is clicked. */
  onToday: () => void
  /** Family members for pill display. */
  members: FamilyMember[]
  /** Calendar events for event count display. */
  events: CalendarEvent[]
  /** Current chores view mode. */
  choresViewMode: ChoresViewMode
  /** Callback when chores view mode changes. */
  onChoresViewChange: (mode: ChoresViewMode) => void
  /** Number of selected master chores. */
  selectedMasterCount: number
  /** Number of selectable master chores in current view. */
  selectableMasterCount: number
  /** Whether all selectable masters are currently selected. */
  allMastersSelected: boolean
  /** Callback when Select All is clicked. */
  onSelectAll: () => void
  /** Callback when Pause Selected is clicked. */
  onPauseSelected: () => void
  /** Callback when Archive Selected is clicked. */
  onArchiveSelected: () => void
  /** Callback when Restore Selected is clicked. */
  onRestoreSelected: () => void
  /** Callback when Delete Selected is clicked. */
  onDeleteSelected: () => void
  /** Callback when Create Master is clicked. */
  onCreateMaster: () => void
}

/**
 * Header component with feature-aware center and right sections.
 *
 * @param props - Header configuration and callbacks.
 * @returns The header UI.
 */
export function Header({
  activeFeature,
  currentView,
  onViewChange,
  onToday,
  members,
  events,
  choresViewMode,
  onChoresViewChange,
  selectedMasterCount,
  selectableMasterCount,
  allMastersSelected,
  onSelectAll,
  onPauseSelected,
  onArchiveSelected,
  onRestoreSelected,
  onDeleteSelected,
  onCreateMaster,
}: HeaderProps) {
  // Count events in the current view's date range (not just today)
  const totalEvents = events.length

  return (
    <header
      className="absolute top-0 left-0 right-0 z-50 border-b border-border bg-white shadow-sm"
      style={{ height: 'var(--shell-header-height)' }}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* LEFT: Date + Clock + Weather — shared across all features */}
        <HeaderLeft />

        {/* CENTER + RIGHT: feature-specific */}
        {activeFeature === 'calendar' ? (
          <>
            {/* CENTER: Family pills with event counts */}
            <div className="flex items-center gap-2">
              {members.map((member) => {
                const memberEvents = events.filter((e) =>
                  e.members.includes(member.key),
                )
                return (
                  <FamilyPill
                    key={member.key}
                    member={member}
                    count={memberEvents.length}
                  />
                )
              })}
              <div className="ml-1 inline-flex items-center rounded-full bg-primary-light px-2 py-1 text-xs font-medium text-primary inset-ring inset-ring-primary/20">
                {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
              </div>
            </div>

            {/* RIGHT: Calendar view switcher + Today + Date picker */}
            <div className="flex items-center gap-3">
              <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />
              <button
                onClick={onToday}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover"
              >
                Today
              </button>
              <button
                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                title="Date picker"
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* CENTER: Empty (board columns show per-member metrics) */}
            <div className="flex-1" />

            {/* RIGHT: Chores view toggle + bulk actions + Create Master */}
            <HeaderChores
              viewMode={choresViewMode}
              onViewChange={onChoresViewChange}
              selectedCount={selectedMasterCount}
              selectableCount={selectableMasterCount}
              allSelected={allMastersSelected}
              onSelectAll={onSelectAll}
              onPauseSelected={onPauseSelected}
              onArchiveSelected={onArchiveSelected}
              onRestoreSelected={onRestoreSelected}
              onDeleteSelected={onDeleteSelected}
              onCreateMaster={onCreateMaster}
            />
          </>
        )}
      </div>
    </header>
  )
}

/** Props for a family member pill. */
interface FamilyPillProps {
  /** The family member. */
  member: FamilyMember
  /** Event count for this member. */
  count: number
}

/**
 * Family member pill with avatar and event count.
 *
 * Displays a colored avatar circle with the member's initial, followed by
 * the event count. Dimmed when count is 0.
 */
function FamilyPill({ member, count }: FamilyPillProps) {
  const paletteKey = resolvePaletteKey(member)

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium inset-ring ${paletteBgOpacityClasses[paletteKey]} ${paletteTextClasses[paletteKey]} ${paletteRingClasses[paletteKey]} ${count === 0 ? 'opacity-50' : ''}`}
    >
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none text-white ${paletteBgClasses[paletteKey]}`}
      >
        {member.initial}
      </div>
      <span>{count}</span>
    </div>
  )
}
