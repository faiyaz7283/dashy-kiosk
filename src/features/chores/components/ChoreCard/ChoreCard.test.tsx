/**
 * Tests for the ChoreCard component.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChoreCard } from './ChoreCard'
import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'

const mockMembers: FamilyMember[] = [
  { name: 'Faiyaz', key: 'faiyaz', calendar_id: 'f@x.com', color: '#4A90E2', initial: 'F' },
  { name: 'Trisha', key: 'trisha', calendar_id: 't@x.com', color: '#E24A8D', initial: 'T' },
]

const mockMasterChore: MasterChore = {
  id: 'mc-1',
  name: 'Wipe Kitchen Counter',
  category: { id: 'cat-1', name: 'Kitchen' },
  tags: [{ id: 'tag-1', name: 'Quick' }],
  difficulty: 2,
  frequency: 'daily',
  estimated_minutes: 15,
  due_time: '18:00',
  due_date: null,
  expiration_behavior: 'disappear',
  created_by: 'trisha',
  approved_by: null,
  status: 'active',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
}

const mockInstance: ChoreInstance = {
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
}

describe('ChoreCard', () => {
  it('renders chore name', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Wipe Kitchen Counter')).toBeInTheDocument()
  })

  it('renders status badge with correct label', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
  })

  it('renders tag chips', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Quick')).toBeInTheDocument()
  })

  it('renders estimated time', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('15m')).toBeInTheDocument()
  })

  it('renders due time', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Due: 18:00')).toBeInTheDocument()
  })

  it('renders "Unclaimed" attribution for open pool instance', () => {
    render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Unclaimed')).toBeInTheDocument()
  })

  it('renders claimed attribution', () => {
    const claimedInstance = { ...mockInstance, status: 'claimed' as const, claimed_by: 'faiyaz' }
    render(
      <ChoreCard instance={claimedInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Claimed by Faiyaz')).toBeInTheDocument()
  })

  it('renders assigned attribution', () => {
    const assignedInstance = {
      ...mockInstance,
      status: 'assigned' as const,
      assigned_to: 'faiyaz',
      assigned_by: 'trisha',
    }
    render(
      <ChoreCard instance={assignedInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    expect(screen.getByText('Assigned by Trisha to Faiyaz')).toBeInTheDocument()
  })

  it('renders completed attribution', () => {
    const completedInstance = {
      ...mockInstance,
      status: 'completed' as const,
      completed_by: 'faiyaz',
    }
    render(
      <ChoreCard
        instance={completedInstance}
        masterChore={mockMasterChore}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Completed by Faiyaz')).toBeInTheDocument()
  })

  it('renders difficulty dots (5 total)', () => {
    const { container } = render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    // Difficulty is 2, so we expect 5 dots total
    const dots = container.querySelectorAll('[style*="border-radius: 50%"]')
    expect(dots.length).toBe(5)
  })

  it('calls onClick with instance when clicked', () => {
    const onClick = vi.fn()
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        members={mockMembers}
        onClick={onClick}
      />,
    )
    fireEvent.click(screen.getByText('Wipe Kitchen Counter'))
    expect(onClick).toHaveBeenCalledWith(mockInstance)
  })

  it('renders different status labels correctly', () => {
    const statuses: Array<{ status: ChoreInstance['status']; label: string }> = [
      { status: 'in_progress', label: 'In Progress' },
      { status: 'completed_pending_signoff', label: 'Pending Signoff' },
      { status: 'overdue', label: 'Overdue' },
      { status: 'expiring_soon', label: 'Expiring Soon' },
    ]

    for (const { status, label } of statuses) {
      const instance = { ...mockInstance, status }
      const { unmount } = render(
        <ChoreCard instance={instance} masterChore={mockMasterChore} members={mockMembers} />,
      )
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('uses default border color when no member is assigned', () => {
    const { container } = render(
      <ChoreCard instance={mockInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    const card = container.firstChild as HTMLElement
    // Unclaimed instance — should use default border color (var(--dt-border))
    expect(card.style.borderLeftColor).toBe('var(--dt-border)')
  })

  it('uses member color for border when instance is claimed', () => {
    const claimedInstance = { ...mockInstance, status: 'claimed' as const, claimed_by: 'faiyaz' }
    const { container } = render(
      <ChoreCard instance={claimedInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    const card = container.firstChild as HTMLElement
    // Faiyaz's color is #4A90E2 — jsdom converts hex to rgb
    expect(card.style.borderLeftColor).toBe('rgb(74, 144, 226)')
  })

  it('uses member color for border when instance is assigned', () => {
    const assignedInstance = {
      ...mockInstance,
      status: 'assigned' as const,
      assigned_to: 'trisha',
      assigned_by: 'faiyaz',
    }
    const { container } = render(
      <ChoreCard instance={assignedInstance} masterChore={mockMasterChore} members={mockMembers} />,
    )
    const card = container.firstChild as HTMLElement
    // Trisha's color is #E24A8D — jsdom converts hex to rgb
    expect(card.style.borderLeftColor).toBe('rgb(226, 74, 141)')
  })

  it('uses completed_by member color for border when completed', () => {
    const completedInstance = {
      ...mockInstance,
      status: 'completed' as const,
      completed_by: 'trisha',
    }
    const { container } = render(
      <ChoreCard
        instance={completedInstance}
        masterChore={mockMasterChore}
        members={mockMembers}
      />,
    )
    const card = container.firstChild as HTMLElement
    // Trisha's color is #E24A8D — jsdom converts hex to rgb
    expect(card.style.borderLeftColor).toBe('rgb(226, 74, 141)')
  })
})
