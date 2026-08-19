/**
 * ChoreModal — create/edit modal for master chore templates.
 *
 * Portals to document.body. Provides form fields for all master chore
 * properties: name, category, tags, difficulty, frequency, estimated time,
 * due time/date, and expiration behavior.
 *
 * Applies useUiScale factor to the content wrapper for consistent sizing
 * on high-resolution displays.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ChoreCategory, ChoreTag, ChoreFrequency, ExpirationBehavior } from '@/types'
import { colors, spacing, radii, typography, shadows, zIndices } from '@/theme/tokens'
import { useUiScale } from '@/features/kiosk/hooks/useUiScale'
import { X } from 'lucide-react'

/** Form data shape for creating/editing a master chore. */
export interface ChoreFormData {
  /** Chore name. */
  name: string
  /** Selected category ID. */
  category_id: string
  /** Selected tag IDs. */
  tag_ids: string[]
  /** Difficulty level (1–5). */
  difficulty: number
  /** How often instances are generated. */
  frequency: ChoreFrequency
  /** Estimated time in minutes, or null. */
  estimated_minutes: number | null
  /** Due time-of-day (ISO string), or null. */
  due_time: string | null
  /** Due date (ISO string), or null. */
  due_date: string | null
  /** What happens when the period expires. */
  expiration_behavior: ExpirationBehavior
  /** Member ID of the creator. */
  created_by: string
}

/** Props for the ChoreModal component. */
export interface ChoreModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean
  /** Close handler. */
  onClose: () => void
  /** Submit handler with form data. */
  onSubmit: (data: ChoreFormData) => void
  /** Available categories for the dropdown. */
  categories: ChoreCategory[]
  /** Available tags for multi-select. */
  tags: ChoreTag[]
  /** Handler to create a new category inline. */
  onCreateCategory: (name: string) => void
  /** Handler to create a new tag inline. */
  onCreateTag: (name: string) => void
  /** Member ID of the current user (creator). */
  currentMemberId: string
}

/** All frequency options. */
const FREQUENCY_OPTIONS: { value: ChoreFrequency; label: string }[] = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

/** All expiration behavior options. */
const EXPIRATION_OPTIONS: { value: ExpirationBehavior; label: string }[] = [
  { value: 'disappear', label: 'Disappear' },
  { value: 'carry_over', label: 'Carry Over' },
  { value: 'stay_visible', label: 'Stay Visible' },
  { value: 'convert_to_open', label: 'Convert to Open' },
]

/**
 * ChoreModal component.
 *
 * @param props - Component props.
 * @returns The modal UI, portaled to document.body.
 */
export function ChoreModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  tags,
  onCreateCategory,
  onCreateTag,
  currentMemberId,
}: ChoreModalProps) {
  const uiScale = useUiScale()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState(3)
  const [frequency, setFrequency] = useState<ChoreFrequency>('weekly')
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('')
  const [dueTime, setDueTime] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [expirationBehavior, setExpirationBehavior] = useState<ExpirationBehavior>('disappear')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)

  /** Reset form when modal opens/closes. */
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setCategoryId('')
      setSelectedTagIds([])
      setDifficulty(3)
      setFrequency('weekly')
      setEstimatedMinutes('')
      setDueTime('')
      setDueDate('')
      setExpirationBehavior('disappear')
      setNewCategoryName('')
      setNewTagName('')
      setShowNewCategory(false)
      setShowNewTag(false)
    }
  }, [isOpen])

  /** Handle form submission. */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim() || !categoryId) return

      onSubmit({
        name: name.trim(),
        category_id: categoryId,
        tag_ids: selectedTagIds,
        difficulty,
        frequency,
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        due_time: dueTime || null,
        due_date: dueDate || null,
        expiration_behavior: expirationBehavior,
        created_by: currentMemberId,
      })
    },
    [
      name,
      categoryId,
      selectedTagIds,
      difficulty,
      frequency,
      estimatedMinutes,
      dueTime,
      dueDate,
      expirationBehavior,
      currentMemberId,
      onSubmit,
    ],
  )

  /** Toggle a tag in the selected list. */
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  /** Handle creating a new category. */
  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim())
      setNewCategoryName('')
      setShowNewCategory(false)
    }
  }

  /** Handle creating a new tag. */
  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim())
      setNewTagName('')
      setShowNewTag(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          zoom: uiScale,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>New Chore</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name */}
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Wipe Kitchen Counter"
              required
            />
          </div>

          {/* Category */}
          <div style={styles.field}>
            <label style={styles.label}>Category</label>
            {showNewCategory ? (
              <div style={styles.inlineCreate}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={styles.input}
                  placeholder="New category name"
                />
                <button type="button" onClick={handleCreateCategory} style={styles.smallBtn}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  style={styles.smallBtn}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={styles.inlineCreate}>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  style={styles.smallBtn}
                >
                  + New
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div style={styles.field}>
            <label style={styles.label}>Tags</label>
            <div style={styles.tagList}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    ...styles.tagToggle,
                    background: selectedTagIds.includes(tag.id) ? colors.primary : colors.border,
                    color: selectedTagIds.includes(tag.id) ? colors.white : colors.textSecondary,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {showNewTag ? (
              <div style={styles.inlineCreate}>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  style={styles.input}
                  placeholder="New tag name"
                />
                <button type="button" onClick={handleCreateTag} style={styles.smallBtn}>
                  Create
                </button>
                <button type="button" onClick={() => setShowNewTag(false)} style={styles.smallBtn}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowNewTag(true)} style={styles.addTagBtn}>
                + Add Tag
              </button>
            )}
          </div>

          {/* Difficulty */}
          <div style={styles.field}>
            <label style={styles.label}>Difficulty</label>
            <div style={styles.difficultySelector}>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  style={{
                    ...styles.difficultyBtn,
                    background: level <= difficulty ? colors.primary : colors.border,
                    color: level <= difficulty ? colors.white : colors.textMuted,
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div style={styles.field}>
            <label style={styles.label}>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
              style={styles.select}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated minutes */}
          <div style={styles.field}>
            <label style={styles.label}>Estimated Time (minutes)</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              style={styles.input}
              placeholder="Optional"
              min="1"
            />
          </div>

          {/* Due time */}
          <div style={styles.field}>
            <label style={styles.label}>Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Due date */}
          <div style={styles.field}>
            <label style={styles.label}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Expiration behavior */}
          <div style={styles.field}>
            <label style={styles.label}>When Period Expires</label>
            <select
              value={expirationBehavior}
              onChange={(e) => setExpirationBehavior(e.target.value as ExpirationBehavior)}
              style={styles.select}
            >
              {EXPIRATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button type="submit" style={styles.submitBtn}>
            Create Chore
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndices.modal,
  },
  modal: {
    background: colors.bg,
    borderRadius: `${radii['2xl']}px`,
    boxShadow: shadows.modal,
    width: '480px',
    maxHeight: '80vh',
    overflowY: 'auto',
    padding: `${spacing.xl}px`,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: `${spacing.lg}px`,
  },
  modalTitle: {
    fontSize: `${typography.headerTitle.size}px`,
    fontWeight: typography.headerTitle.weight,
    color: colors.textPrimary,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.textMuted,
    padding: `${spacing.xs}px`,
    borderRadius: `${radii.sm}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.md}px`,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.xs}px`,
  },
  label: {
    fontSize: `${typography.dayCardSubtext.size}px`,
    fontWeight: 600,
    color: colors.textSecondary,
  },
  input: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: `${radii.md}px`,
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.textPrimary,
    fontSize: `${typography.pillText.size}px`,
    outline: 'none',
  },
  select: {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: `${radii.md}px`,
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.textPrimary,
    fontSize: `${typography.pillText.size}px`,
    outline: 'none',
  },
  inlineCreate: {
    display: 'flex',
    gap: `${spacing.sm}px`,
    alignItems: 'center',
  },
  smallBtn: {
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: `${radii.md}px`,
    border: `1px solid ${colors.border}`,
    background: colors.bgHover,
    color: colors.textSecondary,
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${spacing.xs}px`,
  },
  tagToggle: {
    padding: '2px 8px',
    borderRadius: `${radii.full}px`,
    border: 'none',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  addTagBtn: {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: `${spacing.xs}px 0`,
  },
  difficultySelector: {
    display: 'flex',
    gap: `${spacing.xs}px`,
  },
  difficultyBtn: {
    width: '32px',
    height: '32px',
    borderRadius: `${radii.md}px`,
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  submitBtn: {
    marginTop: `${spacing.sm}px`,
    padding: `${spacing.md}px`,
    borderRadius: `${radii.lg}px`,
    border: 'none',
    background: colors.primary,
    color: colors.white,
    fontSize: `${typography.pillText.size}px`,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
}
