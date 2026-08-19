/**
 * Tests for the OpenPoolColumn component.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OpenPoolColumn } from './OpenPoolColumn'
import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'

const mockMembers: FamilyMember[] = [
  { name: 'Faiyaz', key: 'faiyaz', calendar_id: 'f@x.com', color: '#4A90E2', initial: 'F' },
]

const mockMasterChore: MasterChore = {
  id: 'mc-1',
  name: 'Clean Bathroom',
  category: { id: 'cat-1', name: 'Bathroom' },
  tags: [],
  difficulty: 3,
  frequency: 'weekly',
  estimated_minutes: 30,
  due_time: null,
  due_date: null,
  expiration_behavior: 'carry_over',
  created_by: 'faiyaz',
  approved_by: null,
  status: 'active',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
}

const mockMasterChoresMap = new Map<string, MasterChore>([['mc-1', mockMasterChore]])

const openInstance: ChoreInstance = {
  id: 'inst-1',
  master_chore_id: 'mc-1',
  period_start: '2026-08-18',
  period_end: '2026-08-25',
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

describe('OpenPoolColumn', () => {
  it('renders header with "Open Pool" title', () => {
    render(
      <OpenPoolColumn
        instances={[openInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Open Pool')).toBeInTheDocument()
  })

  it('renders count badge with correct number', () => {
    render(
      <OpenPoolColumn
        instances={[openInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders chore cards for each open instance', () => {
    render(
      <OpenPoolColumn
        instances={[openInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Clean Bathroom')).toBeInTheDocument()
  })

  it('shows empty text when no instances', () => {
    render(
      <OpenPoolColumn instances={[]} masterChoresMap={mockMasterChoresMap} members={mockMembers} />,
    )
    expect(screen.getByText('No open chores')).toBeInTheDocument()
  })

  it('renders multiple instances', () => {
    const secondInstance: ChoreInstance = {
      ...openInstance,
      id: 'inst-2',
    }
    render(
      <OpenPoolColumn
        instances={[openInstance, secondInstance]}
        masterChoresMap={mockMasterChoresMap}
        members={mockMembers}
      />,
    )
    // Both instances reference the same master chore, so name appears twice
    const names = screen.getAllByText('Clean Bathroom')
    expect(names.length).toBe(2)
  })
})
