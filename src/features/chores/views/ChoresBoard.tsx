/**
 * Chores board view — member columns with per-column metrics.
 *
 * Displays a kanban-style board with:
 * - Equal-width columns (flex-1) for Open Pool + each family member
 * - Per-column metric cards (Asn/Clm/Prog/Done/Over) in column header
 * - Member name as colored pill, + button as colored pill circle
 * - Open Pool uses gray pills
 *
 * Each column shows chore instances with status-colored left borders.
 */

import { useMemo, useState } from 'react'
import {
  User,
  Hand,
  Play,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { ContentCard } from '@/shared/components/ContentCard'
import { ChoreCard } from '../components/ChoreCard'
import { AssociationPickerModal } from '../components/AssociationPickerModal'
import { InstanceInteraction } from '../components/InstanceInteraction'
import {
  isOpenPoolInstance,
  getMemberInstances,
  getColumnMetrics,
  getOpenPoolMetrics,
} from '@/shared/utils/chores'
import type { OpenPoolMetrics } from '@/shared/utils/chores'
import type {
  ChoresData,
  ChoreInstance,
  MasterChore,
  FamilyMember,
} from '@/types'
import {
  buildMemberColorMap,
  paletteBgClasses,
  paletteBorderOpacityClasses,
  getMemberPaletteKey,
  type PaletteKey,
} from '@/shared/utils/memberColors'

/** Props for the ChoresBoard component. */
export interface ChoresBoardProps {
  /** Family members for column headers. */
  members: FamilyMember[]
  /** Chores data from useChoresData hook. */
  data: ChoresData | null
  /** Whether initial load is in progress. */
  isLoading: boolean
  /** Whether background refresh is in progress. */
  isRefreshing: boolean
  /** Error message, if any. */
  error: string | null
  /** Callback when Start action is triggered on an instance. */
  onStartInstance?: (instance: ChoreInstance) => void
  /** Callback when Complete action is triggered on an instance. */
  onCompleteInstance?: (instance: ChoreInstance) => void
  /** Callback when Delete action is triggered on an instance. */
  onDeleteInstance?: (instance: ChoreInstance) => void
  /** Callback when Revert (undo) action is triggered on an instance. */
  onRevertInstance?: (instance: ChoreInstance) => void
  /** Callback when Claim action is triggered on an open pool instance. */
  onClaimInstance?: (instanceId: string, memberId: string) => void
  /** Callback when Assign action is triggered on an open pool instance. */
  onAssignInstance?: (instanceId: string, assigneeId: string, assignerId: string) => void
  /** Callback when View Template is clicked (opens edit modal). */
  onViewTemplate?: (masterChore: MasterChore) => void
}

/**
 * Chores board with per-column metrics and member columns.
 *
 * @param props - Component props.
 * @returns The chores board UI.
 */
export function ChoresBoard({
  members,
  data,
  isLoading,
  error,
  onStartInstance,
  onCompleteInstance,
  onDeleteInstance,
  onRevertInstance,
  onClaimInstance,
  onAssignInstance,
  onViewTemplate,
}: ChoresBoardProps) {
  const [pickerTarget, setPickerTarget] = useState<FamilyMember | null | undefined>(undefined)
  const [selectedInstance, setSelectedInstance] = useState<ChoreInstance | null>(null)

  const colorMap = useMemo(() => buildMemberColorMap(members), [members])

  // Memoize destructured data to prevent unnecessary re-renders
  const instances = useMemo(() => data?.instances ?? [], [data])
  const masterChores = useMemo(() => data?.master_chores ?? [], [data])
  const categories = useMemo(() => data?.categories ?? [], [data])
  const associations = useMemo(() => data?.associations ?? [], [data])

  // Filter out archived instances at the board boundary
  const visibleInstances = useMemo(
    () => instances.filter((i) => i.status !== 'archived'),
    [instances],
  )

  // Get open pool instances (unclaimed and unassigned)
  const openPoolInstances = useMemo(
    () => visibleInstances.filter(isOpenPoolInstance),
    [visibleInstances],
  )

  // Helper to get master chore for an instance
  const getMasterChore = useMemo(() => {
    const masterMap = new Map(masterChores.map((mc) => [mc.id, mc]))
    return (instance: ChoreInstance): MasterChore | undefined =>
      masterMap.get(instance.master_chore_id)
  }, [masterChores])

  // Association picker modal state
  const isPickerOpen = pickerTarget !== undefined

  const handleOpenPicker = (memberKey?: string) => {
    if (memberKey) {
      setPickerTarget(members.find((m) => m.key === memberKey) ?? null)
    } else {
      setPickerTarget(null)
    }
  }

  const handleClosePicker = () => setPickerTarget(undefined)

  if (isLoading) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading chores...</p>
        </div>
      </ContentCard>
    )
  }

  if (error) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-danger">Error loading chores: {error}</p>
        </div>
      </ContentCard>
    )
  }

  if (!data) {
    return null
  }

  return (
    <ContentCard>
      <div className="flex h-full flex-col">
        {/* Columns row — equal width */}
        <div className="flex flex-1 gap-3 overflow-hidden p-3">
          {/* Open Pool column */}
          <Column
            title="Open Pool"
            isGray
            metrics={getOpenPoolMetrics(openPoolInstances)}
            onAdd={() => handleOpenPicker()}
          >
            {openPoolInstances.map((instance) => {
              const master = getMasterChore(instance)
              if (!master) return null
              return (
                <ChoreCard
                  key={instance.id}
                  instance={instance}
                  masterChore={master}
                  categories={categories}
                  colorMap={colorMap}
                  onClick={() => setSelectedInstance(instance)}
                  onStart={() => onStartInstance?.(instance)}
                  onComplete={() => onCompleteInstance?.(instance)}
                  onDelete={() => onDeleteInstance?.(instance)}
                  onRevert={() => onRevertInstance?.(instance)}
                />
              )
            })}
          </Column>

          {/* Member columns */}
          {members.map((member) => {
            const memberInstances = getMemberInstances(visibleInstances, member.key)
            const paletteKey = getMemberPaletteKey(member.key, colorMap)

            return (
              <Column
                key={member.key}
                title={member.name}
                paletteKey={paletteKey}
                metrics={getColumnMetrics(memberInstances)}
                onAdd={() => handleOpenPicker(member.key)}
              >
                {memberInstances.map((instance) => {
                  const master = getMasterChore(instance)
                  if (!master) return null
                  return (
                    <ChoreCard
                      key={instance.id}
                      instance={instance}
                      masterChore={master}
                      categories={categories}
                      colorMap={colorMap}
                      onClick={() => setSelectedInstance(instance)}
                      onStart={() => onStartInstance?.(instance)}
                      onComplete={() => onCompleteInstance?.(instance)}
                      onDelete={() => onDeleteInstance?.(instance)}
                      onRevert={() => onRevertInstance?.(instance)}
                    />
                  )
                })}
              </Column>
            )
          })}
        </div>

        {/* Association picker modal */}
        {isPickerOpen && data && (
          <AssociationPickerModal
            targetMember={pickerTarget ?? null}
            masterChores={masterChores}
            categories={categories}
            associations={associations}
            members={members}
            onClose={handleClosePicker}
            onAssociationCreated={handleClosePicker}
          />
        )}

        {/* Instance interaction popup */}
        {selectedInstance && (() => {
          const master = getMasterChore(selectedInstance)
          if (!master) return null
          return (
            <InstanceInteraction
              instance={selectedInstance}
              masterChore={master}
              categories={categories}
              members={members}
              colorMap={colorMap}
              onClose={() => setSelectedInstance(null)}
              onStart={() => {
                onStartInstance?.(selectedInstance)
                setSelectedInstance(null)
              }}
              onComplete={() => {
                onCompleteInstance?.(selectedInstance)
                setSelectedInstance(null)
              }}
              onClaim={(memberId: string) => {
                onClaimInstance?.(selectedInstance.id, memberId)
                setSelectedInstance(null)
              }}
              onAssign={(assigneeId: string, assignerId: string) => {
                onAssignInstance?.(selectedInstance.id, assigneeId, assignerId)
                setSelectedInstance(null)
              }}
              onViewTemplate={() => {
                onViewTemplate?.(master)
                setSelectedInstance(null)
              }}
            />
          )
        })()}
      </div>
    </ContentCard>
  )
}

/** Props for the Column component. */
interface ColumnProps {
  /** Column title (member name or "Open Pool"). */
  title: string
  /** Whether to use gray pills (for Open Pool). */
  isGray?: boolean
  /** Palette key for member color. */
  paletteKey?: PaletteKey
  /** Metric counts for display — member column metrics or open pool metrics. */
  metrics:
    | {
        assigned: number
        claimed: number
        inProgress: number
        completed: number
        overdue: number
      }
    | OpenPoolMetrics
  /** Callback when add button is clicked. */
  onAdd?: () => void
  /** Child chore cards. */
  children: React.ReactNode
}

/**
 * Column component for member or open pool.
 *
 * @param props - Column props.
 * @returns The column UI.
 */
function Column({
  title,
  isGray,
  paletteKey,
  metrics,
  onAdd,
  children,
}: ColumnProps) {
  // Determine pill classes based on gray vs member color
  const namePillClasses = isGray
    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
    : paletteKey
      ? `${paletteBgClasses[paletteKey]} text-white border ${paletteBorderOpacityClasses[paletteKey]}`
      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'

  const addBtnClasses = isGray
    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'
    : paletteKey
      ? `${paletteBgClasses[paletteKey]} text-white border ${paletteBorderOpacityClasses[paletteKey]} hover:opacity-90`
      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-bg-hover/50">
      {/* Column header */}
      <div className="border-b border-border-light bg-bg-hover px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${namePillClasses}`}
          >
            {title}
          </span>
          <button
            onClick={onAdd}
            className={`inline-flex items-center justify-center h-6 w-6 rounded-full transition-colors ${addBtnClasses}`}
            title={`Add to ${title}`}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Metric cards — different layout for open pool vs member columns */}
        {'total' in metrics ? (
          <div className="grid grid-cols-3 gap-1.5">
            <MetricCard
              icon={<User className="h-2.5 w-2.5 text-text-muted" />}
              label="Total"
              value={metrics.total}
            />
            <MetricCard
              icon={
                <AlertTriangle className="h-2.5 w-2.5 text-chores-overdue" />
              }
              label="Over"
              value={metrics.overdue}
              valueClass="text-chores-overdue"
            />
            <MetricCard
              icon={
                <CheckCircle className="h-2.5 w-2.5 text-chores-active" />
              }
              label="Today"
              value={metrics.dueToday}
              valueClass="text-chores-active"
            />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            <MetricCard
              icon={<User className="h-2.5 w-2.5 text-text-muted" />}
              label="Asn"
              value={metrics.assigned}
            />
            <MetricCard
              icon={<Hand className="h-2.5 w-2.5 text-text-muted" />}
              label="Clm"
              value={metrics.claimed}
            />
            <MetricCard
              icon={<Play className="h-2.5 w-2.5 text-chores-in-progress" />}
              label="Prog"
              value={metrics.inProgress}
              valueClass="text-chores-in-progress"
            />
            <MetricCard
              icon={
                <CheckCircle className="h-2.5 w-2.5 text-chores-completed" />
              }
              label="Done"
              value={metrics.completed}
              valueClass="text-chores-completed"
            />
            <MetricCard
              icon={
                <AlertTriangle className="h-2.5 w-2.5 text-chores-overdue" />
              }
              label="Over"
              value={metrics.overdue}
              valueClass="text-chores-overdue"
            />
          </div>
        )}
      </div>

      {/* Chore cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">{children}</div>
    </div>
  )
}

/** Props for the MetricCard component. */
interface MetricCardProps {
  /** Icon to display. */
  icon: React.ReactNode
  /** Short label (e.g., "Asn", "Clm"). */
  label: string
  /** Metric value. */
  value: number
  /** Optional color class for the value. */
  valueClass?: string
}

/**
 * Compact metric card for column header.
 *
 * @param props - MetricCard props.
 * @returns The metric card UI.
 */
function MetricCard({ icon, label, value, valueClass }: MetricCardProps) {
  return (
    <div className="rounded-md border border-border-light bg-white px-1.5 py-1 text-center dark:bg-bg">
      <div className="mb-0.5 flex items-center justify-center gap-0.5">
        {icon}
        <span className="text-[8px] text-text-muted leading-none">
          {label}
        </span>
      </div>
      <div
        className={`text-sm font-bold leading-tight ${valueClass ?? 'text-text-primary'}`}
      >
        {value}
      </div>
    </div>
  )
}
