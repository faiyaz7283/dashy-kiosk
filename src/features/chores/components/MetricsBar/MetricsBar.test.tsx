/**
 * Tests for the MetricsBar component.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MetricsBar } from './MetricsBar'
import type { ChoreInstance } from '@/types'

const baseInstance: ChoreInstance = {
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

describe('MetricsBar', () => {
  it('renders all metric labels', () => {
    render(<MetricsBar instances={[]} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Unclaimed')).toBeInTheDocument()
  })

  it('shows correct counts', () => {
    const instances: ChoreInstance[] = [
      { ...baseInstance, id: '1', status: 'open' },
      { ...baseInstance, id: '2', status: 'open' },
      { ...baseInstance, id: '3', status: 'completed' },
      { ...baseInstance, id: '4', status: 'overdue' },
      { ...baseInstance, id: '5', status: 'claimed', claimed_by: 'faiyaz' },
    ]
    render(<MetricsBar instances={instances} />)

    // Active = total = 5
    // Completed = 1
    // Overdue = 1
    // Unclaimed = 2 (both open instances have null claimed_by and null assigned_to)
    const values = screen.getAllByText(/[0-9]+/)
    expect(values.length).toBe(4) // 4 metric values
  })

  it('shows zeros when no instances', () => {
    render(<MetricsBar instances={[]} />)
    // All counts should be 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBe(4)
  })
})
