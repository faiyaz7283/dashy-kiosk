/**
 * Association picker modal — select a master chore to associate with a member or open pool.
 *
 * Displays available master chores (not yet associated to the target) with
 * search, group filter (All/Recurring/One-off), and sort options.
 * Opens from the column `+` button on the chores board.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ArrowUpDown, X } from 'lucide-react'
import type {
  MasterChore,
  ChoreAssociation,
  ChoreCategory,
} from '@/types/chores'
import type { FamilyMember } from '@/types/family'
import {
  paletteBgClasses,
  paletteRingClasses,
  getMemberPaletteKey,
  isValidPaletteKey,
  type PaletteKey,
} from '@/shared/utils/memberColors'
import { formatRecurrence, formatDifficulty } from '@/shared/utils/chores'
import { useConfig } from '@/shared/date'
import { useChoreActions } from '../hooks/useChoreActions'
import { DifficultyDots } from './DifficultyDots'
import { findFirstAdult } from '@/shared/utils/family'

/** Sort options for the master chore list. */
type SortOption = 'name-asc' | 'name-desc' | 'category' | 'difficulty'

/** Group filter options. */
type GroupFilter = 'all' | 'recurring' | 'one-off'

/** Props for the AssociationPickerModal component. */
export interface AssociationPickerModalProps {
  /** Target member, or null for open pool. */
  targetMember: FamilyMember | null
  /** All master chore templates. */
  masterChores: MasterChore[]
  /** Available categories. */
  categories: ChoreCategory[]
  /** All associations (to filter already-associated masters). */
  associations: ChoreAssociation[]
  /** Family members (for created_by lookup). */
  members: FamilyMember[]
  /** Callback to close the modal. */
  onClose: () => void
  /** Callback after a successful association is created. */
  onAssociationCreated: () => void
}

/**
 * Modal for picking a master chore to associate with a member or open pool.
 *
 * @param props - Component props.
 * @returns The association picker modal UI.
 */
export function AssociationPickerModal({
  targetMember,
  masterChores,
  categories,
  associations,
  members,
  onClose,
  onAssociationCreated,
}: AssociationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('name-asc')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const { timezone } = useConfig()
  const actions = useChoreActions(onAssociationCreated)

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sortOpen])

  const targetName = targetMember?.name ?? 'Open Pool'
  const targetKey = targetMember?.key ?? null

  // Category lookup map
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  // Member color map for avatar
  const colorMap = useMemo(() => {
    const map = new Map<string, PaletteKey>()
    if (targetMember) {
      const key = isValidPaletteKey(targetMember.color_key)
        ? targetMember.color_key
        : 'blue'
      map.set(targetMember.key, key)
    }
    return map
  }, [targetMember])

  const avatarPaletteKey = targetMember
    ? getMemberPaletteKey(targetMember.key, colorMap)
    : null

  // Available masters: active, not yet associated to target
  const availableMasters = useMemo(() => {
    const associatedMasterIds = new Set(
      associations
        .filter((a) => {
          if (a.removed_at !== null) return false
          if (targetKey) return a.member_id === targetKey
          return a.is_open_pool
        })
        .map((a) => a.master_chore_id),
    )

    return masterChores.filter(
      (mc) => mc.status === 'active' && !associatedMasterIds.has(mc.id),
    )
  }, [masterChores, associations, targetKey])

  // Apply group filter
  const groupedMasters = useMemo(() => {
    if (groupFilter === 'recurring') {
      return availableMasters.filter((mc) => mc.recurrence_rule !== null)
    }
    if (groupFilter === 'one-off') {
      return availableMasters.filter((mc) => mc.recurrence_rule === null)
    }
    return availableMasters
  }, [availableMasters, groupFilter])

  // Apply search filter
  const searchedMasters = useMemo(() => {
    if (!searchQuery.trim()) return groupedMasters
    const query = searchQuery.toLowerCase()
    return groupedMasters.filter((mc) => {
      const categoryName = categoryMap.get(mc.category.id) ?? ''
      return (
        mc.name.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query)
      )
    })
  }, [groupedMasters, searchQuery, categoryMap])

  // Apply sort
  const sortedMasters = useMemo(() => {
    const sorted = [...searchedMasters]
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name))
      case 'category':
        return sorted.sort((a, b) => {
          const catA = categoryMap.get(a.category.id) ?? ''
          const catB = categoryMap.get(b.category.id) ?? ''
          return catA.localeCompare(catB) || a.name.localeCompare(b.name)
        })
      case 'difficulty':
        return sorted.sort((a, b) => b.difficulty - a.difficulty)
      default:
        return sorted
    }
  }, [searchedMasters, sortOption, categoryMap])

  // Split into recurring and one-off sections
  const recurringMasters = sortedMasters.filter(
    (mc) => mc.recurrence_rule !== null,
  )
  const oneOffMasters = sortedMasters.filter(
    (mc) => mc.recurrence_rule === null,
  )

  const showSections = groupFilter === 'all'

  const handleAssign = async (masterChoreId: string) => {
    const adult = findFirstAdult(members)
    const createdBy = adult?.key ?? members[0]?.key ?? 'unknown'

    const associationData = {
      master_chore_id: masterChoreId,
      created_by: createdBy,
      ...(targetKey
        ? { member_id: targetKey }
        : { is_open_pool: true as const }),
    }

    await actions.createAssociation(associationData)
    onClose()
  }

  /** Render a master chore list item. */
  const renderMasterItem = (master: MasterChore) => {
    const categoryName = categoryMap.get(master.category.id) ?? 'Uncategorized'
    const isOneOff = master.recurrence_rule === null
    const recurrenceSummary = isOneOff
      ? 'No recurrence'
      : formatRecurrence(master.recurrence_rule, timezone)

    return (
      <div
        key={master.id}
        className="cursor-pointer border-b border-border-light px-6 py-3 transition-colors hover:bg-bg-hover"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Name + category tag */}
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {master.name}
              </h3>
              <span className="shrink-0 rounded bg-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                {categoryName}
              </span>
              {isOneOff && (
                <span className="shrink-0 rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  One-time
                </span>
              )}
            </div>

            {/* Recurrence + estimated time */}
            <div className="mb-1.5 flex items-center gap-3">
              <span className="text-xs text-text-muted">
                {recurrenceSummary}
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">
                {master.estimated_minutes ?? 0}m
              </span>
            </div>

            {/* Difficulty dots + label */}
            <div className="flex items-center gap-2">
              <DifficultyDots level={master.difficulty} size="md" />
              <span className="text-[10px] text-text-muted">
                {formatDifficulty(master.difficulty)}
              </span>
            </div>
          </div>

          {/* Assign button */}
          <button
            onClick={() => handleAssign(master.id)}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Assign
          </button>
        </div>
      </div>
    )
  }

  /** Sort option label. */
  const sortLabel: Record<SortOption, string> = {
    'name-asc': 'Name A–Z',
    'name-desc': 'Name Z–A',
    category: 'Category',
    difficulty: 'Difficulty',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-modal ring-1 ring-border dark:bg-bg">
        {/* Header — 3-column grid */}
        <div className="border-b border-border px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Member avatar — left */}
            {targetMember ? (
              <div
                className={`flex h-8 w-8 items-center justify-center justify-self-start rounded-full text-sm font-bold text-white ring-2 ${paletteBgClasses[avatarPaletteKey ?? 'blue']} ${paletteRingClasses[avatarPaletteKey ?? 'blue']}`}
              >
                {targetName.charAt(0)}
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center justify-self-start rounded-full bg-gray-400 text-sm font-bold text-white">
                OP
              </div>
            )}

            {/* Title — centered */}
            <h2 className="whitespace-nowrap text-center text-lg font-semibold text-text-primary">
              {targetMember ? `Assign Chores to ${targetName}` : 'Assign to Open Pool'}
            </h2>

            {/* Close button — right */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="justify-self-end rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Count + Group toggle + Sort */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chores..."
              className="w-full rounded-lg border border-border bg-bg-hover py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Count */}
          <span className="shrink-0 text-xs text-text-muted">
            {availableMasters.length} available
          </span>

          {/* Group toggle */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(['all', 'recurring', 'one-off'] as const).map((group) => (
              <button
                key={group}
                onClick={() => setGroupFilter(group)}
                className={`border-r border-border px-3 py-1.5 text-xs font-medium transition-colors last:border-r-0 ${
                  groupFilter === group
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-muted hover:bg-bg-hover hover:text-text-primary dark:bg-bg'
                }`}
              >
                {group === 'all' ? 'All' : group === 'recurring' ? 'Recurring' : 'One-off'}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {sortOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-white shadow-popup dark:bg-bg">
                {(Object.entries(sortLabel) as [SortOption, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSortOption(value)
                        setSortOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-bg-hover ${
                        sortOption === value
                          ? 'bg-bg-hover/50 text-text-primary'
                          : 'text-text-secondary'
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {sortedMasters.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-text-muted">No chores available</p>
            </div>
          ) : showSections ? (
            <>
              {recurringMasters.length > 0 && (
                <>
                  <div className="px-6 pt-3 pb-1">
                    <span className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      Recurring
                    </span>
                  </div>
                  {recurringMasters.map(renderMasterItem)}
                </>
              )}
              {oneOffMasters.length > 0 && (
                <>
                  <div className="px-6 pt-3 pb-1">
                    <span className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      One-off
                    </span>
                  </div>
                  {oneOffMasters.map(renderMasterItem)}
                </>
              )}
            </>
          ) : (
            sortedMasters.map(renderMasterItem)
          )}
        </div>
      </div>
    </div>
  )
}
