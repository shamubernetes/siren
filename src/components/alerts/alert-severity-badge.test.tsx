import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlertSeverityBadge } from './alert-severity-badge'

describe('AlertSeverityBadge', () => {
  it('renders "Critical" for critical severity', () => {
    render(<AlertSeverityBadge severity="critical" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('renders "Critical" for crit severity', () => {
    render(<AlertSeverityBadge severity="crit" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('renders "Warning" for warning severity', () => {
    render(<AlertSeverityBadge severity="warning" />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('renders "Warning" for warn severity', () => {
    render(<AlertSeverityBadge severity="warn" />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('renders "Info" for info severity', () => {
    render(<AlertSeverityBadge severity="info" />)
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('renders "Info" for informational severity', () => {
    render(<AlertSeverityBadge severity="informational" />)
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('renders custom severity value for unknown severity', () => {
    render(<AlertSeverityBadge severity="custom-severity" />)
    expect(screen.getByText('custom-severity')).toBeInTheDocument()
  })

  it('renders "Unknown" when severity is undefined', () => {
    render(<AlertSeverityBadge />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders "Unknown" when severity is empty string', () => {
    render(<AlertSeverityBadge severity="" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('is case-insensitive', () => {
    render(<AlertSeverityBadge severity="CRITICAL" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('handles whitespace', () => {
    render(<AlertSeverityBadge severity="  critical  " />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})
