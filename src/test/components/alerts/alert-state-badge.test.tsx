import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { AlertStateBadge } from '@/components/alerts/alert-state-badge'

function createMockAlert(
  overrides?: Partial<AlertmanagerAlert>,
): AlertmanagerAlert {
  return {
    annotations: {},
    endsAt: '2024-01-01T00:00:00Z',
    fingerprint: 'test-fingerprint',
    labels: { alertname: 'TestAlert' },
    startsAt: '2024-01-01T00:00:00Z',
    status: { state: 'active' },
    ...overrides,
  }
}

describe('AlertStateBadge', () => {
  it('renders "Firing" for active alert', () => {
    const alert = createMockAlert({ status: { state: 'active' } })
    render(<AlertStateBadge alert={alert} />)
    expect(screen.getByText('Firing')).toBeInTheDocument()
  })

  it('renders "Silenced" for silenced alert', () => {
    const alert = createMockAlert({
      status: { state: 'active', silencedBy: ['silence-1'] },
    })
    render(<AlertStateBadge alert={alert} />)
    expect(screen.getByText('Silenced')).toBeInTheDocument()
  })

  it('renders "Inhibited" for inhibited alert', () => {
    const alert = createMockAlert({
      status: { state: 'active', inhibitedBy: ['inhibit-1'] },
    })
    render(<AlertStateBadge alert={alert} />)
    expect(screen.getByText('Inhibited')).toBeInTheDocument()
  })

  it('renders "Other" for non-active alert', () => {
    const alert = createMockAlert({ status: { state: 'suppressed' } })
    render(<AlertStateBadge alert={alert} />)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('prioritizes silenced over inhibited', () => {
    const alert = createMockAlert({
      status: {
        state: 'active',
        silencedBy: ['silence-1'],
        inhibitedBy: ['inhibit-1'],
      },
    })
    render(<AlertStateBadge alert={alert} />)
    expect(screen.getByText('Silenced')).toBeInTheDocument()
    expect(screen.queryByText('Inhibited')).not.toBeInTheDocument()
  })
})

