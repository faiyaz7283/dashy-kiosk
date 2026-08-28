/**
 * Tests for chores utility functions.
 *
 * Validates chore instance filtering, classification, and formatting.
 */

import { describe, it, expect } from 'vitest'
import {
  isOpenPoolInstance,
  getMemberInstances,
  getMemberAssociations,
  getOpenPoolAssociations,
  getStatusColor,
  formatDifficulty,
  getStatusLabel,
  formatRecurrence,
  getColumnMetrics,
} from './chores'
import type { ChoreInstance, ChoreAssociation, InstanceStatus, RecurrenceRule } from '@/types/chores'

describe('chores utilities', () => {
  // Test instances
  const openPoolInstance: ChoreInstance = {
    id: '1',
    master_chore_id: 'mc1',
    association_id: null,
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'active',
    claimed_by: null,
    assigned_to: null,
    assigned_by: null,
    completed_by: null,
    started_at: null,
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const claimedInstance: ChoreInstance = {
    id: '2',
    master_chore_id: 'mc2',
    association_id: 'assoc-1',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'active',
    claimed_by: 'alice',
    assigned_to: null,
    assigned_by: null,
    completed_by: null,
    started_at: null,
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const assignedInstance: ChoreInstance = {
    id: '3',
    master_chore_id: 'mc3',
    association_id: 'assoc-2',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'active',
    claimed_by: null,
    assigned_to: 'bob',
    assigned_by: 'parent',
    completed_by: null,
    started_at: null,
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const completedInstance: ChoreInstance = {
    id: '4',
    master_chore_id: 'mc4',
    association_id: 'assoc-3',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'completed',
    claimed_by: 'alice',
    assigned_to: null,
    assigned_by: null,
    completed_by: 'alice',
    started_at: '2026-01-15T10:00:00',
    completed_at: '2026-01-15T11:00:00',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const instances: ChoreInstance[] = [
    openPoolInstance,
    claimedInstance,
    assignedInstance,
    completedInstance,
  ]

  // Test associations
  const memberAssociation: ChoreAssociation = {
    id: 'assoc-1',
    master_chore_id: 'mc1',
    member_id: 'alice',
    is_open_pool: false,
    created_by: 'parent',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    removed_at: null,
  }

  const openPoolAssociation: ChoreAssociation = {
    id: 'assoc-2',
    master_chore_id: 'mc2',
    member_id: null,
    is_open_pool: true,
    created_by: 'parent',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    removed_at: null,
  }

  const removedAssociation: ChoreAssociation = {
    id: 'assoc-3',
    master_chore_id: 'mc3',
    member_id: 'bob',
    is_open_pool: false,
    created_by: 'parent',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    removed_at: '2026-01-10T00:00:00Z',
  }

  const associations: ChoreAssociation[] = [
    memberAssociation,
    openPoolAssociation,
    removedAssociation,
  ]

  describe('isOpenPoolInstance', () => {
    it('returns true for unclaimed and unassigned instance', () => {
      expect(isOpenPoolInstance(openPoolInstance)).toBe(true)
    })

    it('returns false for claimed instance', () => {
      expect(isOpenPoolInstance(claimedInstance)).toBe(false)
    })

    it('returns false for assigned instance', () => {
      expect(isOpenPoolInstance(assignedInstance)).toBe(false)
    })

    it('returns false for completed instance', () => {
      expect(isOpenPoolInstance(completedInstance)).toBe(false)
    })
  })

  describe('getMemberInstances', () => {
    it('returns instances claimed by member', () => {
      const result = getMemberInstances(instances, 'alice')
      expect(result).toHaveLength(2)
      expect(result).toContainEqual(claimedInstance)
      expect(result).toContainEqual(completedInstance)
    })

    it('returns instances assigned to member', () => {
      const result = getMemberInstances(instances, 'bob')
      expect(result).toHaveLength(1)
      expect(result).toContainEqual(assignedInstance)
    })

    it('returns empty array for member with no instances', () => {
      const result = getMemberInstances(instances, 'charlie')
      expect(result).toHaveLength(0)
    })

    it('handles empty instances array', () => {
      const result = getMemberInstances([], 'alice')
      expect(result).toHaveLength(0)
    })
  })

  describe('getMemberAssociations', () => {
    it('returns active associations for member', () => {
      const result = getMemberAssociations(associations, 'alice')
      expect(result).toHaveLength(1)
      expect(result).toContainEqual(memberAssociation)
    })

    it('excludes removed associations', () => {
      const result = getMemberAssociations(associations, 'bob')
      expect(result).toHaveLength(0)
    })

    it('excludes open pool associations', () => {
      const result = getMemberAssociations(associations, 'nobody')
      expect(result).toHaveLength(0)
    })
  })

  describe('getOpenPoolAssociations', () => {
    it('returns active open pool associations', () => {
      const result = getOpenPoolAssociations(associations)
      expect(result).toHaveLength(1)
      expect(result).toContainEqual(openPoolAssociation)
    })

    it('handles empty array', () => {
      const result = getOpenPoolAssociations([])
      expect(result).toHaveLength(0)
    })
  })

  describe('getStatusColor', () => {
    it('returns color for active status', () => {
      const color = getStatusColor('active')
      expect(color).toBeDefined()
      expect(typeof color).toBe('string')
    })

    it('returns color for completed status', () => {
      const color = getStatusColor('completed')
      expect(color).toBeDefined()
      expect(typeof color).toBe('string')
    })

    it('returns color for overdue status', () => {
      const color = getStatusColor('overdue')
      expect(color).toBeDefined()
      expect(typeof color).toBe('string')
    })

    it('returns different colors for different statuses', () => {
      const activeColor = getStatusColor('active')
      const completedColor = getStatusColor('completed')
      const overdueColor = getStatusColor('overdue')

      expect(activeColor).not.toBe(completedColor)
      expect(activeColor).not.toBe(overdueColor)
      expect(completedColor).not.toBe(overdueColor)
    })
  })

  describe('formatDifficulty', () => {
    it('returns "Easy" for level 1', () => {
      expect(formatDifficulty(1)).toBe('Easy')
    })

    it('returns "Easy-Medium" for level 2', () => {
      expect(formatDifficulty(2)).toBe('Easy-Medium')
    })

    it('returns "Medium" for level 3', () => {
      expect(formatDifficulty(3)).toBe('Medium')
    })

    it('returns "Hard" for level 4', () => {
      expect(formatDifficulty(4)).toBe('Hard')
    })

    it('returns "Very Hard" for level 5', () => {
      expect(formatDifficulty(5)).toBe('Very Hard')
    })

    it('handles level below 1', () => {
      expect(formatDifficulty(0)).toBe('Easy')
    })

    it('handles level above 5', () => {
      expect(formatDifficulty(6)).toBe('Very Hard')
    })
  })

  describe('getStatusLabel', () => {
    const allStatuses: InstanceStatus[] = [
      'active',
      'in_progress',
      'completed',
      'overdue',
      'missed',
      'archived',
    ]

    it('returns label for all statuses', () => {
      allStatuses.forEach((status) => {
        const label = getStatusLabel(status)
        expect(label).toBeDefined()
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
      })
    })

    it('returns "Active" for active status', () => {
      expect(getStatusLabel('active')).toBe('Active')
    })

    it('returns "In Progress" for in_progress status', () => {
      expect(getStatusLabel('in_progress')).toBe('In Progress')
    })

    it('returns "Completed" for completed status', () => {
      expect(getStatusLabel('completed')).toBe('Completed')
    })

    it('returns "Overdue" for overdue status', () => {
      expect(getStatusLabel('overdue')).toBe('Overdue')
    })

    it('returns "Missed" for missed status', () => {
      expect(getStatusLabel('missed')).toBe('Missed')
    })

    it('returns "Archived" for archived status', () => {
      expect(getStatusLabel('archived')).toBe('Archived')
    })
  })

  describe('formatRecurrence', () => {
    it('returns "No recurrence" for null rule', () => {
      expect(formatRecurrence(null)).toBe('No recurrence')
    })

    it('formats once frequency', () => {
      const rule: RecurrenceRule = { frequency: 'once', time: '10:00' }
      expect(formatRecurrence(rule)).toBe('One-time')
    })

    it('formats daily frequency', () => {
      const rule: RecurrenceRule = { frequency: 'daily', time: '08:00' }
      expect(formatRecurrence(rule)).toBe('Daily at 8:00 AM')
    })

    it('formats weekly frequency', () => {
      const rule: RecurrenceRule = { frequency: 'weekly', time: '09:00', day_of_week: 0 }
      expect(formatRecurrence(rule)).toBe('Weekly on Monday at 9:00 AM')
    })

    it('formats monthly frequency with day_of_month', () => {
      const rule: RecurrenceRule = { frequency: 'monthly', time: '10:00', day_of_month: 3 }
      expect(formatRecurrence(rule)).toBe('Monthly on the 3rd at 10:00 AM')
    })

    it('formats monthly frequency with nth weekday', () => {
      const rule: RecurrenceRule = { frequency: 'monthly', time: '08:00', day_of_week: 0, week_of_month: 1 }
      expect(formatRecurrence(rule)).toBe('Monthly on the first Monday at 8:00 AM')
    })

    it('formats yearly frequency with month and day', () => {
      const rule: RecurrenceRule = { frequency: 'yearly', time: '09:00', month: 1, day_of_month: 15 }
      expect(formatRecurrence(rule)).toBe('Yearly on January 15th at 9:00 AM')
    })

    it('formats yearly frequency with nth weekday', () => {
      const rule: RecurrenceRule = { frequency: 'yearly', time: '12:00', month: 11, day_of_week: 3, week_of_month: 4 }
      expect(formatRecurrence(rule)).toBe('Yearly on the fourth Thursday of November at 12:00 PM')
    })
  })

  describe('getColumnMetrics', () => {
    it('returns zero counts for empty array', () => {
      const metrics = getColumnMetrics([])
      expect(metrics).toEqual({
        assigned: 0,
        claimed: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
      })
    })

    it('counts assigned instances', () => {
      const instances: ChoreInstance[] = [
        { ...openPoolInstance, assigned_to: 'alice' },
        { ...openPoolInstance, assigned_to: 'bob' },
        openPoolInstance,
      ]
      const metrics = getColumnMetrics(instances)
      expect(metrics.assigned).toBe(2)
    })

    it('counts claimed instances', () => {
      const instances: ChoreInstance[] = [
        { ...openPoolInstance, claimed_by: 'alice' },
        { ...openPoolInstance, claimed_by: 'bob' },
        openPoolInstance,
      ]
      const metrics = getColumnMetrics(instances)
      expect(metrics.claimed).toBe(2)
    })

    it('counts in_progress instances', () => {
      const instances: ChoreInstance[] = [
        { ...openPoolInstance, status: 'in_progress' },
        { ...openPoolInstance, status: 'active' },
        { ...openPoolInstance, status: 'in_progress' },
      ]
      const metrics = getColumnMetrics(instances)
      expect(metrics.inProgress).toBe(2)
    })

    it('counts completed instances', () => {
      const instances: ChoreInstance[] = [
        { ...openPoolInstance, status: 'completed' },
        { ...openPoolInstance, status: 'active' },
        { ...openPoolInstance, status: 'completed' },
      ]
      const metrics = getColumnMetrics(instances)
      expect(metrics.completed).toBe(2)
    })

    it('counts overdue instances', () => {
      const instances: ChoreInstance[] = [
        { ...openPoolInstance, status: 'overdue' },
        { ...openPoolInstance, status: 'active' },
        { ...openPoolInstance, status: 'overdue' },
      ]
      const metrics = getColumnMetrics(instances)
      expect(metrics.overdue).toBe(2)
    })

    it('handles mixed instance types', () => {
      const instances: ChoreInstance[] = [
        { ...openPoolInstance, assigned_to: 'alice', status: 'in_progress' },
        { ...openPoolInstance, claimed_by: 'bob', status: 'completed' },
        { ...openPoolInstance, status: 'overdue' },
        { ...openPoolInstance, assigned_to: 'charlie', status: 'active' },
      ]
      const metrics = getColumnMetrics(instances)
      expect(metrics.assigned).toBe(2)
      expect(metrics.claimed).toBe(1)
      expect(metrics.inProgress).toBe(1)
      expect(metrics.completed).toBe(1)
      expect(metrics.overdue).toBe(1)
    })
  })
})
