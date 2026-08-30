/**
 * Master chore modal — create or edit a master chore template.
 *
 * Form fields: Name, Category (combobox), Tags, Difficulty, Recurrence Pattern
 * (frequency + conditional fields), Est. minutes, Due time, Due date,
 * Expiration behavior, End date, Max occurrences, Collaborative toggle.
 * Conditions section shows "Coming soon".
 *
 * Uses existing shared components: Combobox, TagInput, DifficultySlider.
 * Calls createMaster/updateMaster via useChoreActions on submit.
 */

import { useState, useMemo, type FormEvent } from 'react'
import { X, RotateCw, Info, Trash2, Users, UserPlus } from 'lucide-react'
import type {
  MasterChore,
  ChoreAssociation,
  ChoreCategory,
  ChoreTag,
  CreateMasterChoreRequest,
  UpdateMasterChoreRequest,
} from '@/types/chores'
import type { FamilyMember } from '@/types/family'
import { Combobox } from '@/shared/components/Combobox'
import { TagInput } from '@/shared/components/TagInput'
import { DurationInput } from '@/shared/components/DurationInput'
import { Tooltip } from '@/shared/components/Tooltip'
import { formatDifficulty } from '@/shared/utils/chores'
import { toMinutes, fromMinutes, type DurationUnit } from '@/shared/utils/duration'
import { useChoreActions } from '../hooks/useChoreActions'
import { DifficultyDots } from './DifficultyDots'
import { findFirstAdult } from '@/shared/utils/family'
import { useNotifications } from '@/shared/context/NotificationContext'

/** Recurrence frequency options (includes "once" for one-off). */
type RecurrenceFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Week-of-month options for nth weekday patterns. */
const WEEK_ORDINALS: { value: number; label: string }[] = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: 'Last' },
]

/** Day-of-week abbreviations for toggle buttons (0=Monday, 6=Sunday). */
const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Month names for yearly select (1-indexed). */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Monthly pattern type — mutually exclusive options. */
type MonthlyPattern = 'dayOfMonth' | 'nthWeekday'

/** Form state for the master chore modal. */
interface FormState {
  name: string
  categoryId: string
  tagIds: string[]
  difficulty: number
  frequency: RecurrenceFrequency
  frequencyInterval: number
  dayOfWeek: number
  monthlyPattern: MonthlyPattern
  dayOfMonth: string
  nthWeekOfMonth: number
  nthDayOfWeek: number
  yearMonth: number
  yearDay: string
  estimatedDuration: { value: string; unit: DurationUnit }
  dueTime: string
  dueDate: string
  endDate: string
  maxOccurrences: string
  isCollaborative: boolean
}

/** Default form state for create mode. */
const DEFAULT_FORM: FormState = {
  name: '',
  categoryId: '',
  tagIds: [],
  difficulty: 3,
  frequency: 'weekly',
  frequencyInterval: 1,
  dayOfWeek: 0,
  monthlyPattern: 'dayOfMonth',
  dayOfMonth: '1',
  nthWeekOfMonth: 1,
  nthDayOfWeek: 0,
  yearMonth: 1,
  yearDay: '1',
  estimatedDuration: { value: '10', unit: 'minutes' },
  dueTime: '',
  dueDate: '',
  endDate: '',
  maxOccurrences: '',
  isCollaborative: false,
}

/** Props for the MasterChoreModal component. */
export interface MasterChoreModalProps {
  /** Whether creating a new master or editing an existing one. */
  mode: 'create' | 'edit'
  /** Existing master chore (required for edit mode). */
  master?: MasterChore
  /** Available categories. */
  categories: ChoreCategory[]
  /** Available tags. */
  tags: ChoreTag[]
  /** All associations (filtered by master in component). */
  associations?: ChoreAssociation[]
  /** Family members (for created_by lookup). */
  members: FamilyMember[]
  /** Callback to close the modal. */
  onClose: () => void
  /** Callback after successful create/update. */
  onSuccess: () => void
}

/**
 * Modal form for creating or editing a master chore template.
 *
 * @param props - Component props.
 * @returns The master chore modal UI.
 */
export function MasterChoreModal({
  mode,
  master,
  categories,
  tags,
  associations: allAssociations,
  members,
  onClose,
  onSuccess,
}: MasterChoreModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    mode === 'edit' && master ? formFromMaster(master) : { ...DEFAULT_FORM },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'template' | 'associations'>('template')

  const actions = useChoreActions()
  const { addNotification } = useNotifications()

  // Filter associations for this master chore
  const masterAssociations = useMemo(() => {
    if (!master || !allAssociations) return []
    return allAssociations.filter(
      (a) => a.master_chore_id === master.id && a.removed_at === null,
    )
  }, [master, allAssociations])

  // Build member lookup for association display
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.key, m.name])),
    [members],
  )

  // Members not yet associated (for adding new associations)
  const availableMembers = useMemo(() => {
    if (!master) return members
    const associatedKeys = new Set(
      masterAssociations
        .filter((a) => a.member_id !== null)
        .map((a) => a.member_id!),
    )
    return members.filter((m) => !associatedKeys.has(m.key))
  }, [master, members, masterAssociations])

  const hasOpenPool = useMemo(
    () => masterAssociations.some((a) => a.member_id === null),
    [masterAssociations],
  )

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  )

  const tagItems = useMemo(
    () => tags.map((t) => ({ id: t.id, label: t.name })),
    [tags],
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !form.name.trim() || !form.categoryId) return

    setIsSubmitting(true)

    try {
      // Template creation has no UI context (no column/instance), so use first adult as default creator.
      // This is metadata about who created the template, not an action actor.
      const adult = findFirstAdult(members)
      const createdBy = adult?.key ?? members[0]?.key
      if (!createdBy) {
        throw new Error('No family members available to create chore template')
      }
      const estimatedMinutes = form.estimatedDuration.value
        ? toMinutes(Number(form.estimatedDuration.value), form.estimatedDuration.unit)
        : null

      // Build flattened recurrence fields from form state
      const recurrenceFields = buildRecurrenceFields(form)

      if (mode === 'create') {
        const request: CreateMasterChoreRequest = {
          name: form.name.trim(),
          category_id: form.categoryId,
          ...(form.tagIds.length > 0 ? { tag_ids: form.tagIds } : {}),
          difficulty: form.difficulty,
          ...recurrenceFields,
          ...(estimatedMinutes ? { estimated_minutes: estimatedMinutes } : {}),
          ...(form.dueTime ? { due_time: form.dueTime } : {}),
          ...(form.dueDate ? { due_date: form.dueDate } : {}),
          ...(form.endDate ? { end_date: form.endDate } : {}),
          ...(form.maxOccurrences ? { max_occurrences: Number(form.maxOccurrences) } : {}),
          is_collaborative: form.isCollaborative,
          created_by: createdBy,
        }
        await actions.createMaster(request)
        addNotification({
          type: 'success',
          title: 'Chore template created',
          message: form.name.trim(),
        })
        onSuccess()
      } else if (master) {
        const request: UpdateMasterChoreRequest = {
          name: form.name.trim(),
          category_id: form.categoryId,
          tag_ids: form.tagIds,
          difficulty: form.difficulty,
          ...recurrenceFields,
          estimated_minutes: estimatedMinutes,
          due_time: form.dueTime || null,
          due_date: form.dueDate || null,
          end_date: form.endDate || null,
          max_occurrences: form.maxOccurrences ? Number(form.maxOccurrences) : null,
          is_collaborative: form.isCollaborative,
        }
        await actions.updateMaster(master.id, request)
        addNotification({
          type: 'success',
          title: 'Chore template updated',
          message: form.name.trim(),
        })
        onSuccess()
      }
    } catch {
      // Error is logged by useChoreActions — re-enable form
      setIsSubmitting(false)
    }
  }

  const isWeekly = form.frequency === 'weekly'
  const isMonthly = form.frequency === 'monthly'
  const isYearly = form.frequency === 'yearly'
  const showRecurrenceSection = form.frequency !== 'once'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-modal ring-1 ring-border dark:bg-bg">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              {mode === 'create' ? 'New Chore Template' : 'Edit Chore Template'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab bar — only show in edit mode */}
          {mode === 'edit' && (
            <div className="mt-4 flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'template'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('associations')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'associations'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                Associations
                {masterAssociations.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {masterAssociations.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          {activeTab === 'template' ? (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Name */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Name
                </label>
                <Tooltip content="The name of this chore template. Examples: 'Wipe Counter', 'Take Out Trash', 'Water Plants'">
                  <Info className="h-3.5 w-3.5 text-text-faint" />
                </Tooltip>
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Wipe Counter"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category + Tags row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-text-muted">Category</span>
                  <Tooltip content="Primary classification — where or what type of chore. Each chore has one category (e.g., Kitchen, Bathroom). Create new categories inline by typing a name.">
                    <Info className="h-3 w-3 text-text-faint" />
                  </Tooltip>
                </div>
                <Combobox
                  label=""
                  options={categoryOptions}
                  value={form.categoryId}
                  onChange={(id) => updateField('categoryId', id)}
                  onCreate={async (name) => {
                    const category = await actions.createCategory(name)
                    updateField('categoryId', category.id)
                  }}
                  placeholder="Select category..."
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-text-muted">Tags</span>
                  <Tooltip content="Optional labels for filtering and grouping. Add multiple tags per chore (e.g., Quick, Daily, Heavy). Create new tags inline by typing and pressing Enter.">
                    <Info className="h-3 w-3 text-text-faint" />
                  </Tooltip>
                </div>
                <TagInput
                  label=""
                  availableTags={tagItems}
                  value={form.tagIds}
                  onChange={(ids) => updateField('tagIds', ids)}
                  onCreate={async (name) => {
                    const tag = await actions.createTag(name)
                    updateField('tagIds', [...form.tagIds, tag.id])
                  }}
                  placeholder="Add tag..."
                />
              </div>
            </div>

            {/* Difficulty + Estimated Duration row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Difficulty
                  </label>
                  <Tooltip content="How difficult this chore is. 1=Very Easy, 5=Very Hard">
                    <Info className="h-3.5 w-3.5 text-text-faint" />
                  </Tooltip>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.difficulty}
                    onChange={(e) => updateField('difficulty', Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-border accent-primary"
                  />
                  <div className="flex items-center gap-2">
                    <DifficultyDots level={form.difficulty} size="md" />
                    <span className="w-12 text-xs text-text-muted">
                      {formatDifficulty(form.difficulty)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">
                    Estimated Duration
                  </label>
                  <Tooltip content="How long this chore typically takes to complete">
                    <Info className="h-3.5 w-3.5 text-text-faint" />
                  </Tooltip>
                </div>
                <DurationInput
                  label=""
                  value={form.estimatedDuration.value}
                  onValueChange={(value) =>
                    updateField('estimatedDuration', { ...form.estimatedDuration, value })
                  }
                  unit={form.estimatedDuration.unit}
                  onUnitChange={(unit) =>
                    updateField('estimatedDuration', { ...form.estimatedDuration, unit })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Recurrence Pattern section */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <RotateCw className="h-4 w-4 text-text-muted" />
                  Recurrence Pattern
                </h3>
                <Tooltip content="How often this chore repeats. 'Once' for one-time chores, or choose a recurring schedule.">
                  <Info className="h-3.5 w-3.5 text-text-faint" />
                </Tooltip>
              </div>

              {/* Frequency + Interval row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <label className="text-xs font-medium text-text-muted">
                      Frequency
                    </label>
                    <Tooltip content="How often this chore repeats">
                      <Info className="h-3 w-3 text-text-faint" />
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <select
                      value={form.frequency}
                      onChange={(e) => updateField('frequency', e.target.value as RecurrenceFrequency)}
                      className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <ChevronDownIcon />
                  </div>
                </div>
                {form.frequency !== 'once' && (
                  <div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <label className="text-xs font-medium text-text-muted">
                        Every
                      </label>
                      <Tooltip content={`Repeat every N ${form.frequency === 'daily' ? 'days' : form.frequency === 'weekly' ? 'weeks' : form.frequency === 'monthly' ? 'months' : 'years'}`}>
                        <Info className="h-3 w-3 text-text-faint" />
                      </Tooltip>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={form.frequencyInterval}
                      onChange={(e) => updateField('frequencyInterval', Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Weekly: Day of week toggle */}
              {isWeekly && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Day of Week
                  </label>
                  <div className="flex gap-1.5">
                    {DAY_ABBRS.map((abbr, index) => (
                      <button
                        key={abbr}
                        type="button"
                        onClick={() => updateField('dayOfWeek', index)}
                        className={`h-9 w-9 rounded-lg text-xs font-medium transition-colors ${
                          form.dayOfWeek === index
                            ? 'bg-primary text-white'
                            : 'border border-border bg-bg text-text-muted hover:bg-bg-hover'
                        }`}
                      >
                        {abbr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly: Day of month OR Nth weekday (mutually exclusive) */}
              {isMonthly && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-text-muted">
                    Monthly Pattern
                  </label>
                  <div className="space-y-3">
                    {/* Option 1: Day of month */}
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="monthlyPattern"
                        value="dayOfMonth"
                        checked={form.monthlyPattern === 'dayOfMonth'}
                        onChange={() => updateField('monthlyPattern', 'dayOfMonth')}
                        className="mt-0.5 h-3.5 w-3.5 border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="mb-1 text-xs font-medium text-text-secondary">
                          On a specific day
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={form.dayOfMonth}
                          onChange={(e) => updateField('dayOfMonth', e.target.value)}
                          placeholder="1-31"
                          disabled={form.monthlyPattern !== 'dayOfMonth'}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                    </label>

                    {/* Option 2: Nth weekday */}
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="monthlyPattern"
                        value="nthWeekday"
                        checked={form.monthlyPattern === 'nthWeekday'}
                        onChange={() => updateField('monthlyPattern', 'nthWeekday')}
                        className="mt-0.5 h-3.5 w-3.5 border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="mb-1 text-xs font-medium text-text-secondary">
                          On the Nth weekday
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select
                              value={form.nthWeekOfMonth}
                              onChange={(e) => updateField('nthWeekOfMonth', Number(e.target.value))}
                              disabled={form.monthlyPattern !== 'nthWeekday'}
                              className="w-full appearance-none rounded-lg border border-border bg-bg px-2 py-2 text-xs text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                              {WEEK_ORDINALS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <ChevronDownIcon />
                          </div>
                          <div className="relative flex-1">
                            <select
                              value={form.nthDayOfWeek}
                              onChange={(e) => updateField('nthDayOfWeek', Number(e.target.value))}
                              disabled={form.monthlyPattern !== 'nthWeekday'}
                              className="w-full appearance-none rounded-lg border border-border bg-bg px-2 py-2 text-xs text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                              {DAY_ABBRS.map((abbr, index) => (
                                <option key={abbr} value={index}>{abbr}</option>
                              ))}
                            </select>
                            <ChevronDownIcon />
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Yearly: Month + Day */}
              {isYearly && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Yearly Pattern
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-text-faint">
                        Month
                      </label>
                      <div className="relative">
                        <select
                          value={form.yearMonth}
                          onChange={(e) => updateField('yearMonth', Number(e.target.value))}
                          className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {MONTH_NAMES.map((name, index) => (
                            <option key={name} value={index + 1}>{name}</option>
                          ))}
                        </select>
                        <ChevronDownIcon />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-text-faint">
                        Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.yearDay}
                        onChange={(e) => updateField('yearDay', e.target.value)}
                        placeholder="1-31"
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Due Time — available for all frequencies */}
              <div className="border-t border-border-light pt-4">
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  Due Time <span className="font-normal text-text-faint">(optional)</span>
                </label>
                <input
                  type="time"
                  value={form.dueTime}
                  onChange={(e) => updateField('dueTime', e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Due Date — one-time only */}
              {form.frequency === 'once' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Due Date <span className="font-normal text-text-faint">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* End conditions (recurring only) */}
              {showRecurrenceSection && (
                <div className="grid grid-cols-2 gap-4 border-t border-border-light pt-4">
                  <div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <label className="text-xs font-medium text-text-muted">
                        End Date <span className="font-normal text-text-faint">(optional)</span>
                      </label>
                      <Tooltip content="Stop generating new instances after this date">
                        <Info className="h-3 w-3 text-text-faint" />
                      </Tooltip>
                    </div>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <label className="text-xs font-medium text-text-muted">
                        Max Occurrences <span className="font-normal text-text-faint">(optional)</span>
                      </label>
                      <Tooltip content="Stop generating new instances after this many occurrences">
                        <Info className="h-3 w-3 text-text-faint" />
                      </Tooltip>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={form.maxOccurrences}
                      onChange={(e) => updateField('maxOccurrences', e.target.value)}
                      placeholder="No limit"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Collaborative toggle */}
            <div className="flex items-start gap-3 border-t border-border-light py-3">
              <ToggleSwitch
                checked={form.isCollaborative}
                onChange={(val) => updateField('isCollaborative', val)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium text-text-secondary">Collaborative</div>
                  <Tooltip content="Allow multiple family members to have instances of this chore at the same time">
                    <Info className="h-3.5 w-3.5 text-text-faint" />
                  </Tooltip>
                </div>
                <div className="text-xs text-text-faint">
                  Allow multiple members to have instances at the same time
                </div>
              </div>
            </div>

            {/* Conditions section — deferred */}
            <div className="flex items-center justify-between border-t border-border-light py-3">
              <div>
                <div className="text-sm font-medium text-text-disabled">Conditions</div>
                <div className="text-xs text-text-faint">
                  Set requirements for completion (e.g., "Must take a photo")
                </div>
              </div>
              <span className="rounded bg-bg-hover px-2 py-0.5 text-[10px] font-medium text-text-faint">
                Coming soon
              </span>
            </div>
          </div>
          ) : (
            /* Associations tab */
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AssociationsTab
                master={master!}
                associations={masterAssociations}
                members={members}
                memberMap={memberMap}
                availableMembers={availableMembers}
                hasOpenPool={hasOpenPool}
                actions={actions}
                addNotification={addNotification}
              />
            </div>
          )}

          {/* Footer */}
          <div className="shrink-0 border-t border-border bg-bg-hover/50 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim() || !form.categoryId}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Saving...'
                  : mode === 'create'
                    ? 'Create Template'
                    : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Props for the ToggleSwitch component. */
interface ToggleSwitchProps {
  /** Whether the toggle is on. */
  checked: boolean
  /** Callback when toggled. */
  onChange: (value: boolean) => void
}

/**
 * Toggle switch for boolean form fields.
 *
 * @param props - Component props.
 * @returns The toggle switch UI.
 */
function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-10 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

/**
 * Chevron down icon for custom select elements.
 *
 * @returns The chevron icon SVG.
 */
function ChevronDownIcon() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-muted"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/**
 * Build flattened recurrence fields from form state for the API request.
 *
 * Returns an object with frequency, frequency_interval, and the relevant
 * day/week/month fields based on the selected frequency. Returns an empty
 * object for "once" frequency (no recurrence fields).
 *
 * @param form - Current form state.
 * @returns Partial request fields for recurrence.
 */
function buildRecurrenceFields(
  form: FormState,
): Pick<
  CreateMasterChoreRequest,
  'frequency' | 'frequency_interval' | 'day_of_week' | 'day_of_month' | 'week_of_month' | 'month'
> {
  switch (form.frequency) {
    case 'once':
      return { frequency: 'once' }
    case 'daily':
      return { frequency: 'daily', frequency_interval: form.frequencyInterval }
    case 'weekly':
      return {
        frequency: 'weekly',
        frequency_interval: form.frequencyInterval,
        day_of_week: [form.dayOfWeek],
      }
    case 'monthly': {
      // Only send the fields for the selected pattern type
      if (form.monthlyPattern === 'nthWeekday') {
        // Nth weekday pattern (e.g. "3rd Tuesday")
        return {
          frequency: 'monthly',
          frequency_interval: form.frequencyInterval,
          week_of_month: form.nthWeekOfMonth,
          day_of_week: [form.nthDayOfWeek],
        }
      }
      // Day of month pattern (e.g. "15th of each month")
      const dayOfMonth = Number(form.dayOfMonth) || null
      return {
        frequency: 'monthly',
        frequency_interval: form.frequencyInterval,
        ...(dayOfMonth ? { day_of_month: dayOfMonth } : {}),
      }
    }
    case 'yearly':
      return {
        frequency: 'yearly',
        frequency_interval: form.frequencyInterval,
        month: form.yearMonth,
        day_of_month: Number(form.yearDay) || 1,
      }
    default:
      return { frequency: form.frequency }
  }
}

/**
 * Initialize form state from an existing master chore (edit mode).
 *
 * @param master - The master chore to populate from.
 * @returns The initialized form state.
 */
function formFromMaster(master: MasterChore): FormState {
  const frequency: RecurrenceFrequency = master.frequency ?? 'once'
  const duration = master.estimated_minutes
    ? fromMinutes(master.estimated_minutes)
    : { value: 10, unit: 'minutes' as DurationUnit }

  // Extract first day_of_week for the single-select UI (schema supports arrays)
  const firstDayOfWeek = master.day_of_week?.[0] ?? 0

  // Determine monthly pattern type from backend data
  const monthlyPattern: MonthlyPattern = master.week_of_month != null ? 'nthWeekday' : 'dayOfMonth'

  return {
    name: master.name,
    categoryId: master.category.id,
    tagIds: master.tags.map((t) => t.id),
    difficulty: master.difficulty,
    frequency,
    frequencyInterval: master.frequency_interval ?? 1,
    dayOfWeek: firstDayOfWeek,
    monthlyPattern,
    dayOfMonth: master.day_of_month?.toString() ?? '1',
    nthWeekOfMonth: master.week_of_month ?? 1,
    nthDayOfWeek: firstDayOfWeek,
    yearMonth: master.month ?? 1,
    yearDay: master.day_of_month?.toString() ?? '1',
    estimatedDuration: { value: duration.value.toString(), unit: duration.unit },
    dueTime: master.due_time ?? '',
    dueDate: master.due_date ?? '',
    endDate: master.end_date ?? '',
    maxOccurrences: master.max_occurrences?.toString() ?? '',
    isCollaborative: master.is_collaborative,
  }
}

/** Props for the AssociationsTab component. */
interface AssociationsTabProps {
  /** The master chore being edited. */
  master: MasterChore
  /** Active associations for this master. */
  associations: ChoreAssociation[]
  /** All family members. */
  members: FamilyMember[]
  /** Member key → name lookup. */
  memberMap: Map<string, string>
  /** Members not yet associated. */
  availableMembers: FamilyMember[]
  /** Whether open pool association exists. */
  hasOpenPool: boolean
  /** Chore actions hook. */
  actions: ReturnType<typeof useChoreActions>
  /** Notification callback. */
  addNotification: (notification: { type: 'success' | 'error'; title: string; message: string }) => void
}

/**
 * Associations tab — manage member assignments and open pool.
 *
 * @param props - Component props.
 * @returns The associations tab UI.
 */
function AssociationsTab({
  master,
  associations,
  members,
  memberMap,
  availableMembers,
  hasOpenPool,
  actions,
  addNotification,
}: AssociationsTabProps) {
  const [showAddMember, setShowAddMember] = useState(false)

  const handleRemoveAssociation = async (associationId: string) => {
    try {
      await actions.deleteAssociation(associationId)
      addNotification({
        type: 'success',
        title: 'Association removed',
        message: 'Member has been unassigned from this chore',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to remove association',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleSendToOpenPool = async (associationId: string) => {
    try {
      // Remove the member association
      await actions.deleteAssociation(associationId)
      // Create open pool association (member_id omitted = open pool)
      const createdBy = members[0]?.key
      if (!createdBy) {
        throw new Error('No family members available')
      }
      await actions.createAssociation({
        master_chore_id: master.id,
        created_by: createdBy,
      })
      addNotification({
        type: 'success',
        title: 'Sent to open pool',
        message: 'Chore is now available for anyone to claim',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to send to open pool',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleReassignMember = async (oldAssociationId: string, newMemberKey: string) => {
    try {
      // Remove old association
      await actions.deleteAssociation(oldAssociationId)
      // Create new association with new member
      const createdBy = members[0]?.key
      if (!createdBy) {
        throw new Error('No family members available')
      }
      await actions.createAssociation({
        master_chore_id: master.id,
        member_id: newMemberKey,
        created_by: createdBy,
      })
      const newMemberName = memberMap.get(newMemberKey) ?? 'Unknown'
      addNotification({
        type: 'success',
        title: 'Member reassigned',
        message: `Chore reassigned to ${newMemberName}`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to reassign member',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleAddMember = async (memberKey: string) => {
    try {
      const createdBy = members[0]?.key
      if (!createdBy) {
        throw new Error('No family members available')
      }
      await actions.createAssociation({
        master_chore_id: master.id,
        member_id: memberKey,
        created_by: createdBy,
      })
      const memberName = memberMap.get(memberKey) ?? 'Unknown'
      addNotification({
        type: 'success',
        title: 'Member added',
        message: `${memberName} has been assigned to this chore`,
      })
      setShowAddMember(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to add member',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleAddToOpenPool = async () => {
    try {
      const createdBy = members[0]?.key
      if (!createdBy) {
        throw new Error('No family members available')
      }
      await actions.createAssociation({
        master_chore_id: master.id,
        created_by: createdBy,
      })
      addNotification({
        type: 'success',
        title: 'Added to open pool',
        message: 'Chore is now available for anyone to claim',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to add to open pool',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Assigned Members</h3>
          <p className="text-xs text-text-muted">
            {associations.length === 0
              ? 'No members assigned yet'
              : `${associations.length} member${associations.length !== 1 ? 's' : ''} assigned`}
          </p>
        </div>
        {!showAddMember && availableMembers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Member
          </button>
        )}
      </div>

      {/* Add member dropdown */}
      {showAddMember && (
        <div className="rounded-lg border border-border bg-bg-hover p-3">
          <div className="mb-2 text-xs font-medium text-text-secondary">Select a member to assign:</div>
          <div className="space-y-1">
            {availableMembers.map((member) => (
              <button
                key={member.key}
                type="button"
                onClick={() => handleAddMember(member.key)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-text-primary transition-colors hover:bg-bg-hover"
              >
                <span>{member.name}</span>
                <span className="text-xs text-text-faint">Assign</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAddMember(false)}
            className="mt-2 w-full rounded-md px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Associations list */}
      {associations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-text-faint" />
          <p className="text-sm text-text-muted">No associations yet</p>
          <p className="mt-1 text-xs text-text-faint">
            Add members or send to open pool to start generating instances
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {associations.map((assoc) => {
            const memberName = assoc.member_id ? memberMap.get(assoc.member_id) ?? 'Unknown' : 'Open Pool'
            const isPool = assoc.member_id === null

            return (
              <div
                key={assoc.id}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-hover p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                      isPool ? 'bg-gray-400' : 'bg-primary'
                    }`}
                  >
                    {isPool ? 'OP' : memberName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{memberName}</div>
                    <div className="text-xs text-text-faint">
                      {isPool ? 'Open Pool — anyone can claim' : 'Assigned member'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isPool && availableMembers.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleReassignMember(assoc.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      defaultValue=""
                      className="rounded-md border border-border bg-white px-2 py-1 text-xs text-text-secondary focus:border-transparent focus:outline-none focus:ring-1 focus:ring-primary dark:bg-bg"
                    >
                      <option value="" disabled>
                        Reassign to...
                      </option>
                      {availableMembers.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {!isPool && !hasOpenPool && (
                    <button
                      type="button"
                      onClick={() => handleSendToOpenPool(assoc.id)}
                      className="rounded-md border border-border bg-white px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-hover dark:bg-bg"
                      title="Send to open pool"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveAssociation(assoc.id)}
                    className="rounded-md p-1 text-text-faint transition-colors hover:bg-danger/10 hover:text-danger"
                    title="Remove association"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add to open pool button */}
      {!hasOpenPool && (
        <button
          type="button"
          onClick={handleAddToOpenPool}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-hover p-3 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          <Users className="h-4 w-4" />
          Add to Open Pool
        </button>
      )}
    </div>
  )
}
