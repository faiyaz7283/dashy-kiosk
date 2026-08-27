/**
 * Duration conversion utilities.
 *
 * Converts between different time units (minutes, hours, days) and minutes.
 * Used by the DurationInput component to normalize user input before submission.
 */

/** Duration unit options. */
export type DurationUnit = 'minutes' | 'hours' | 'days'

/** Duration unit display labels. */
export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  minutes: 'min',
  hours: 'hr',
  days: 'day',
}

/** Conversion factors to minutes. */
const MINUTES_PER_UNIT: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440, // 24 * 60
}

/**
 * Convert a duration value from the specified unit to minutes.
 *
 * @param value - Numeric duration value.
 * @param unit - Unit of the value.
 * @returns Duration in minutes.
 */
export function toMinutes(value: number, unit: DurationUnit): number {
  return Math.round(value * MINUTES_PER_UNIT[unit])
}

/**
 * Convert minutes to the most appropriate unit and value.
 *
 * @param minutes - Duration in minutes.
 * @returns Object with value and unit for display.
 */
export function fromMinutes(minutes: number): { value: number; unit: DurationUnit } {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: 'days' }
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: 'hours' }
  }
  return { value: minutes, unit: 'minutes' }
}
