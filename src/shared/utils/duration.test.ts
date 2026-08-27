/**
 * Tests for duration conversion utilities.
 */

import { describe, it, expect } from 'vitest'
import { toMinutes, fromMinutes, DURATION_UNIT_LABELS } from './duration'

describe('toMinutes', () => {
  it('converts minutes to minutes unchanged', () => {
    expect(toMinutes(30, 'minutes')).toBe(30)
    expect(toMinutes(1, 'minutes')).toBe(1)
  })

  it('converts hours to minutes', () => {
    expect(toMinutes(1, 'hours')).toBe(60)
    expect(toMinutes(2, 'hours')).toBe(120)
    expect(toMinutes(0.5, 'hours')).toBe(30)
  })

  it('converts days to minutes', () => {
    expect(toMinutes(1, 'days')).toBe(1440)
    expect(toMinutes(7, 'days')).toBe(10080)
  })

  it('rounds to nearest integer', () => {
    expect(toMinutes(0.1, 'hours')).toBe(6)
  })
})

describe('fromMinutes', () => {
  it('returns minutes for small values', () => {
    expect(fromMinutes(30)).toEqual({ value: 30, unit: 'minutes' })
    expect(fromMinutes(1)).toEqual({ value: 1, unit: 'minutes' })
  })

  it('returns hours for exact hour multiples', () => {
    expect(fromMinutes(60)).toEqual({ value: 1, unit: 'hours' })
    expect(fromMinutes(120)).toEqual({ value: 2, unit: 'hours' })
  })

  it('returns days for exact day multiples', () => {
    expect(fromMinutes(1440)).toEqual({ value: 1, unit: 'days' })
    expect(fromMinutes(2880)).toEqual({ value: 2, unit: 'days' })
  })

  it('returns minutes for values not divisible by 60', () => {
    expect(fromMinutes(90)).toEqual({ value: 90, unit: 'minutes' })
  })

  it('returns hours for values divisible by 60', () => {
    expect(fromMinutes(1500)).toEqual({ value: 25, unit: 'hours' })
  })
})

describe('DURATION_UNIT_LABELS', () => {
  it('has labels for all units', () => {
    expect(DURATION_UNIT_LABELS.minutes).toBe('min')
    expect(DURATION_UNIT_LABELS.hours).toBe('hr')
    expect(DURATION_UNIT_LABELS.days).toBe('day')
  })
})
