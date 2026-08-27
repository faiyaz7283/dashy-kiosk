/**
 * Duration input with inline leading unit dropdown.
 *
 * Follows the Tailwind CSS pattern: a single rounded container with a
 * leading select dropdown (unit) and a trailing number input (value).
 * Focus ring wraps the entire composite control.
 *
 * Used for "Estimated Duration" in the MasterChoreModal.
 */

import { ChevronDown } from 'lucide-react'
import type { DurationUnit } from '@/shared/utils/duration'
import { DURATION_UNIT_LABELS } from '@/shared/utils/duration'

/** Props for the DurationInput component. */
export interface DurationInputProps {
  /** Label displayed above the input. */
  label: string
  /** Current numeric value. */
  value: string
  /** Callback when numeric value changes. */
  onValueChange: (value: string) => void
  /** Current unit. */
  unit: DurationUnit
  /** Callback when unit changes. */
  onUnitChange: (unit: DurationUnit) => void
  /** Placeholder text for the input. */
  placeholder?: string
}

/** Duration unit options for the dropdown. */
const UNIT_OPTIONS: { value: DurationUnit; label: string }[] = [
  { value: 'minutes', label: DURATION_UNIT_LABELS.minutes },
  { value: 'hours', label: DURATION_UNIT_LABELS.hours },
  { value: 'days', label: DURATION_UNIT_LABELS.days },
]

/**
 * Duration input with inline leading unit dropdown.
 *
 * @param props - Component props.
 * @returns The duration input UI.
 */
export function DurationInput({
  label,
  value,
  onValueChange,
  unit,
  onUnitChange,
  placeholder = '0',
}: DurationInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="flex rounded-lg border border-border bg-bg has-[input:focus-within]:border-primary has-[input:focus-within]:ring-2 has-[input:focus-within]:ring-primary-ring">
        {/* Leading unit dropdown */}
        <div className="grid shrink-0 grid-cols-1 focus-within:relative">
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as DurationUnit)}
            className="col-start-1 row-start-1 w-full appearance-none rounded-l-lg bg-bg py-2 pr-6 pl-3 text-sm text-text-muted focus:outline-none"
            aria-label="Duration unit"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 h-4 w-4 self-center justify-self-end text-text-faint"
          />
        </div>

        {/* Trailing numeric input */}
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="block min-w-0 grow bg-bg py-2 pr-3 pl-1 text-sm text-text-primary placeholder-text-faint focus:outline-none"
        />
      </div>
    </div>
  )
}
