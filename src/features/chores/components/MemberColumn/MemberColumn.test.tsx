/**
 * Tests for the MemberColumn component.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemberColumn } from './MemberColumn'
import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'

const mockMember: FamilyMember = {
  name: 'Faiyaz',
  key: 'faiyaz',
  calendar_id: 'f@x.com',
  color: '#4A90E2',
  initial: 'F',
}

const mockMembers: FamilyMember[] = [mockMember]

const mockMasterChore: MasterChore = {
  id: 'mc-1',
  name: 'Vacuum Living Room',
  category: { id: 'cat-1', name: 'General' },
  tags: [],
  difficulty: 2,
  frequency: 'weekly',
  estimated_minutes: 20,
  due_time: null,
  due_date: null,
  expiration_behavior: 'disappear',
  created_by: 'faiyaz',
  approved_by: null,
  status: 'active',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
}

const mockMasterChoresMap = new Map<string, MasterChore>([['mc-1', mockMasterChore]])

const claimedInstance: ChoreInstance = {
  id: 'inst-1',
  master_chore_id: 'mc-1',
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
}

describe('MemberColumn', () => {
  it('renders member name in header', () => {
    render(
      <MemberColumn
        member={mockMember}
        instances={[claimedInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
  })

  it('renders member initial avatar', () => {
    render(
      <MemberColumn
        member={mockMember}
        instances={[claimedInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('renders count badge with correct number', () => {
    render(
      <MemberColumn
        member={mockMember}
        instances={[claimedInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders chore cards for member instances', () => {
    render(
      <MemberColumn
        member={mockMember}
        instances={[claimedInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Vacuum Living Room')).toBeInTheDocument()
  })

  it('shows empty text when no instances', () => {
    render(
      <MemberColumn
        member={mockMember}
        instances={[]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('No chores')).toBeInTheDocument()
  })

  it('renders multiple instances', () => {
    const secondInstance: ChoreInstance = {
      ...claimedInstance,
      id: 'inst-2',
    }
    render(
      <MemberColumn
        member={mockMember}
        instances={[claimedInstance, secondInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    const names = screen.getAllByText('Vacuum Living Room')
    expect(names.length).toBe(2)
  })
})
