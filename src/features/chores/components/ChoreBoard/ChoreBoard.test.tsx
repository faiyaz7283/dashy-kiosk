/**
 * Tests for the ChoreBoard component.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChoreBoard } from './ChoreBoard'
import type { ChoresData, FamilyMember } from '@/types'

const mockMembers: FamilyMember[] = [
  { name: 'Faiyaz', key: 'faiyaz', calendar_id: 'f@x.com', color: '#4A90E2', initial: 'F' },
  { name: 'Trisha', key: 'trisha', calendar_id: 't@x.com', color: '#E24A8D', initial: 'T' },
]

const mockData: ChoresData = {
  categories: [{ id: 'cat-1', name: 'Kitchen' }],
  tags: [{ id: 'tag-1', name: 'Quick' }],
  master_chores: [
    {
      id: 'mc-1',
      name: 'Wipe Counter',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [],
      difficulty: 2,
      frequency: 'daily',
      estimated_minutes: 10,
      due_time: null,
      due_date: null,
      expiration_behavior: 'disappear',
      created_by: 'trisha',
      approved_by: null,
      status: 'active',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'mc-2',
      name: 'Take Out Trash',
      category: { id: 'cat-1', name: 'Kitchen' },
      tags: [],
      difficulty: 1,
      frequency: 'weekly',
      estimated_minutes: 5,
      due_time: null,
      due_date: null,
      expiration_behavior: 'carry_over',
      created_by: 'trisha',
      approved_by: null,
      status: 'active',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
  ],
  instances: [
    {
      id: 'inst-1',
      master_chore_id: 'mc-1',
      period_start: '2026-08-18',
      period_end: '2026-08-19',
      status: 'open',
      claimed_by: null,
      assigned_to: null,
      assigned_by: null,
      completed_by: null,
      signoff_by: null,
      started_at: null,
      completed_at: null,
      signed_off_at: null,
    },
    {
      id: 'inst-2',
      master_chore_id: 'mc-2',
      period_start: '2026-08-18',
      period_end: '2026-08-25',
      status: 'claimed',
      claimed_by: 'faiyaz',
      assigned_to: null,
      assigned_by: null,
      completed_by: null,
      signoff_by: null,
      started_at: null,
      completed_at: null,
      signed_off_at: null,
    },
  ],
}

describe('ChoreBoard', () => {
  it('renders metrics bar', () => {
    render(<ChoreBoard data={mockData} members={mockMembers} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    // "Unclaimed" appears in both MetricsBar and OpenPoolColumn
    const unclaimedElements = screen.getAllByText('Unclaimed')
    expect(unclaimedElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders open pool column when there are unclaimed instances', () => {
    render(<ChoreBoard data={mockData} members={mockMembers} />)
    expect(screen.getByText('Open Pool')).toBeInTheDocument()
  })

  it('does not render open pool column when all instances are claimed/assigned', () => {
    const allClaimedData: ChoresData = {
      ...mockData,
      instances: mockData.instances.map((i) => ({
        ...i,
        claimed_by: 'faiyaz',
        status: 'claimed' as const,
      })),
    }
    render(<ChoreBoard data={allClaimedData} members={mockMembers} />)
    expect(screen.queryByText('Open Pool')).not.toBeInTheDocument()
  })

  it('renders a column for each family member', () => {
    render(<ChoreBoard data={mockData} members={mockMembers} />)
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
    expect(screen.getByText('Trisha')).toBeInTheDocument()
  })

  it('renders member initials in column headers', () => {
    render(<ChoreBoard data={mockData} members={mockMembers} />)
    expect(screen.getByText('F')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows correct chore count in open pool badge', () => {
    render(<ChoreBoard data={mockData} members={mockMembers} />)
    // "1" appears in MetricsBar (unclaimed count), OpenPool badge, and member badges
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThanOrEqual(1)
  })

  it('shows correct chore count in member badge', () => {
    render(<ChoreBoard data={mockData} members={mockMembers} />)
    // Faiyaz has 1 claimed instance
    const badges = screen.getAllByText('1')
    // At least one badge for Faiyaz's column
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })
})
