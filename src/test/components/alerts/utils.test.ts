import { describe, expect, it } from 'vitest'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import {
  alertMatchesQuery,
  formatAgeShort,
  getAlertKind,
  getAlertName,
  getAlertSummary,
  getInterestingLabelBadges,
  getSeverityRank,
  getWatchdogStatus,
  isWatchdogAlert,
  sortAlerts,
} from '@/components/alerts/utils'

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

describe('getAlertKind', () => {
  it('returns "silenced" when alert has silencedBy', () => {
    const alert = createMockAlert({
      status: { state: 'active', silencedBy: ['silence-1'] },
    })
    expect(getAlertKind(alert)).toBe('silenced')
  })

  it('returns "inhibited" when alert has inhibitedBy', () => {
    const alert = createMockAlert({
      status: { state: 'active', inhibitedBy: ['inhibit-1'] },
    })
    expect(getAlertKind(alert)).toBe('inhibited')
  })

  it('returns "firing" when alert is active and not silenced/inhibited', () => {
    const alert = createMockAlert({ status: { state: 'active' } })
    expect(getAlertKind(alert)).toBe('firing')
  })

  it('returns "all" when alert is not active', () => {
    const alert = createMockAlert({ status: { state: 'suppressed' } })
    expect(getAlertKind(alert)).toBe('all')
  })

  it('prioritizes silenced over inhibited', () => {
    const alert = createMockAlert({
      status: {
        state: 'active',
        silencedBy: ['silence-1'],
        inhibitedBy: ['inhibit-1'],
      },
    })
    expect(getAlertKind(alert)).toBe('silenced')
  })
})

describe('getAlertName', () => {
  it('returns alertname from labels', () => {
    const alert = createMockAlert({ labels: { alertname: 'MyAlert' } })
    expect(getAlertName(alert)).toBe('MyAlert')
  })

  it('returns "Alert" when alertname is missing', () => {
    const alert = createMockAlert({ labels: {} })
    expect(getAlertName(alert)).toBe('Alert')
  })
})

describe('isWatchdogAlert', () => {
  it('returns true for Watchdog alert', () => {
    const alert = createMockAlert({ labels: { alertname: 'Watchdog' } })
    expect(isWatchdogAlert(alert)).toBe(true)
  })

  it('returns false for non-Watchdog alert', () => {
    const alert = createMockAlert({ labels: { alertname: 'OtherAlert' } })
    expect(isWatchdogAlert(alert)).toBe(false)
  })

  it('handles whitespace in alertname', () => {
    const alert = createMockAlert({ labels: { alertname: '  Watchdog  ' } })
    expect(isWatchdogAlert(alert)).toBe(true)
  })
})

describe('getWatchdogStatus', () => {
  it('returns missing status when no alerts', () => {
    const status = getWatchdogStatus([])
    expect(status.statusLabel).toBe('Missing')
    expect(status.instances).toBe(0)
    expect(status.description).toContain('No Watchdog alert found')
  })

  it('returns firing status when alert is firing', () => {
    const alert = createMockAlert({
      labels: { alertname: 'Watchdog' },
      status: { state: 'active' },
      startsAt: '2024-01-01T00:00:00Z',
    })
    const status = getWatchdogStatus([alert])
    expect(status.statusLabel).toBe('Firing')
    expect(status.instances).toBe(1)
    expect(status.description).toContain('firing properly')
  })

  it('returns silenced status when alert is silenced', () => {
    const alert = createMockAlert({
      labels: { alertname: 'Watchdog' },
      status: { state: 'active', silencedBy: ['silence-1'] },
      startsAt: '2024-01-01T00:00:00Z',
    })
    const status = getWatchdogStatus([alert])
    expect(status.statusLabel).toBe('Silenced')
    expect(status.description).toContain('silenced')
  })

  it('returns inhibited status when alert is inhibited', () => {
    const alert = createMockAlert({
      labels: { alertname: 'Watchdog' },
      status: { state: 'active', inhibitedBy: ['inhibit-1'] },
      startsAt: '2024-01-01T00:00:00Z',
    })
    const status = getWatchdogStatus([alert])
    expect(status.statusLabel).toBe('Inhibited')
    expect(status.description).toContain('inhibited')
  })

  it('uses updatedAt when available', () => {
    const alert = createMockAlert({
      labels: { alertname: 'Watchdog' },
      status: { state: 'active' },
      startsAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    })
    const status = getWatchdogStatus([alert])
    expect(status.lastUpdatedAt).toBe('2024-01-02T00:00:00Z')
  })

  it('handles invalid timestamps gracefully', () => {
    const alert = createMockAlert({
      labels: { alertname: 'Watchdog' },
      status: { state: 'active' },
      startsAt: 'invalid-date',
    })
    const status = getWatchdogStatus([alert])
    expect(status.lastUpdatedAt).toBe(new Date(0).toISOString())
  })

  it('finds latest timestamp across multiple alerts', () => {
    const alerts = [
      createMockAlert({
        labels: { alertname: 'Watchdog' },
        status: { state: 'active' },
        startsAt: '2024-01-01T00:00:00Z',
      }),
      createMockAlert({
        labels: { alertname: 'Watchdog' },
        status: { state: 'active' },
        startsAt: '2024-01-03T00:00:00Z',
      }),
      createMockAlert({
        labels: { alertname: 'Watchdog' },
        status: { state: 'active' },
        startsAt: '2024-01-02T00:00:00Z',
      }),
    ]
    const status = getWatchdogStatus(alerts)
    expect(status.lastUpdatedAt).toBe('2024-01-03T00:00:00Z')
    expect(status.instances).toBe(3)
  })
})

describe('getAlertSummary', () => {
  it('returns summary annotation when available', () => {
    const alert = createMockAlert({
      annotations: { summary: 'Test summary' },
    })
    expect(getAlertSummary(alert)).toBe('Test summary')
  })

  it('returns description annotation when summary is missing', () => {
    const alert = createMockAlert({
      annotations: { description: 'Test description' },
    })
    expect(getAlertSummary(alert)).toBe('Test description')
  })

  it('returns "No summary" when neither annotation exists', () => {
    const alert = createMockAlert({ annotations: {} })
    expect(getAlertSummary(alert)).toBe('No summary')
  })
})

describe('alertMatchesQuery', () => {
  it('matches label keys', () => {
    const alert = createMockAlert({
      labels: { alertname: 'TestAlert', severity: 'critical' },
    })
    expect(alertMatchesQuery(alert, 'alertname')).toBe(true)
    expect(alertMatchesQuery(alert, 'severity')).toBe(true)
  })

  it('matches label values', () => {
    const alert = createMockAlert({
      labels: { alertname: 'TestAlert', severity: 'critical' },
    })
    expect(alertMatchesQuery(alert, 'testalert')).toBe(true)
    expect(alertMatchesQuery(alert, 'critical')).toBe(true)
  })

  it('matches annotation keys and values', () => {
    const alert = createMockAlert({
      annotations: { summary: 'Test summary', description: 'Test desc' },
    })
    expect(alertMatchesQuery(alert, 'summary')).toBe(true)
    expect(alertMatchesQuery(alert, 'test summary')).toBe(true)
  })

  it('matches fingerprint', () => {
    const alert = createMockAlert({ fingerprint: 'abc123' })
    expect(alertMatchesQuery(alert, 'abc123')).toBe(true)
  })

  it('matches generatorURL', () => {
    const alert = createMockAlert({ generatorURL: 'http://example.com' })
    expect(alertMatchesQuery(alert, 'example.com')).toBe(true)
  })

  it('matches status state', () => {
    const alert = createMockAlert({ status: { state: 'active' } })
    expect(alertMatchesQuery(alert, 'active')).toBe(true)
  })

  it('is case-insensitive', () => {
    const alert = createMockAlert({
      labels: { alertname: 'TestAlert' },
    })
    expect(alertMatchesQuery(alert, 'TESTALERT')).toBe(true)
    expect(alertMatchesQuery(alert, 'testalert')).toBe(true)
  })

  it('returns false when no match', () => {
    const alert = createMockAlert({
      labels: { alertname: 'TestAlert' },
    })
    expect(alertMatchesQuery(alert, 'nonexistent')).toBe(false)
  })
})

describe('formatAgeShort', () => {
  const now = new Date('2024-01-01T12:00:00Z').getTime()

  it('returns seconds for < 60s', () => {
    const startsAt = new Date('2024-01-01T11:59:30Z').toISOString()
    expect(formatAgeShort(startsAt, now)).toBe('30s')
  })

  it('returns minutes for < 60m', () => {
    const startsAt = new Date('2024-01-01T11:30:00Z').toISOString()
    expect(formatAgeShort(startsAt, now)).toBe('30m')
  })

  it('returns hours for < 48h', () => {
    const startsAt = new Date('2024-01-01T06:00:00Z').toISOString()
    expect(formatAgeShort(startsAt, now)).toBe('6h')
  })

  it('returns days for >= 48h', () => {
    const startsAt = new Date('2023-12-30T12:00:00Z').toISOString()
    expect(formatAgeShort(startsAt, now)).toBe('2d')
  })

  it('returns "—" for invalid date', () => {
    expect(formatAgeShort('invalid-date')).toBe('—')
  })

  it('uses current time when nowMs not provided', () => {
    const startsAt = new Date(Date.now() - 30_000).toISOString()
    const result = formatAgeShort(startsAt)
    expect(result).toBe('30s')
  })
})

describe('getSeverityRank', () => {
  it('returns 0 for critical/crit', () => {
    expect(getSeverityRank('critical')).toBe(0)
    expect(getSeverityRank('crit')).toBe(0)
    expect(getSeverityRank('Critical')).toBe(0)
  })

  it('returns 1 for warning/warn', () => {
    expect(getSeverityRank('warning')).toBe(1)
    expect(getSeverityRank('warn')).toBe(1)
    expect(getSeverityRank('Warning')).toBe(1)
  })

  it('returns 2 for info/informational', () => {
    expect(getSeverityRank('info')).toBe(2)
    expect(getSeverityRank('informational')).toBe(2)
    expect(getSeverityRank('Info')).toBe(2)
  })

  it('returns 3 for unknown severity', () => {
    expect(getSeverityRank('unknown')).toBe(3)
    expect(getSeverityRank('')).toBe(3)
    expect(getSeverityRank()).toBe(3)
  })
})

describe('sortAlerts', () => {
  it('sorts by severity rank first', () => {
    const critical = createMockAlert({
      labels: { alertname: 'Alert1', severity: 'critical' },
    })
    const warning = createMockAlert({
      labels: { alertname: 'Alert2', severity: 'warning' },
    })
    expect(sortAlerts(critical, warning)).toBeLessThan(0)
    expect(sortAlerts(warning, critical)).toBeGreaterThan(0)
  })

  it('sorts by startsAt when severity is equal', () => {
    const older = createMockAlert({
      labels: { alertname: 'Alert1', severity: 'critical' },
      startsAt: '2024-01-01T00:00:00Z',
    })
    const newer = createMockAlert({
      labels: { alertname: 'Alert2', severity: 'critical' },
      startsAt: '2024-01-02T00:00:00Z',
    })
    expect(sortAlerts(older, newer)).toBeLessThan(0)
    expect(sortAlerts(newer, older)).toBeGreaterThan(0)
  })

  it('sorts by fingerprint when severity and startsAt are equal', () => {
    const a = createMockAlert({
      labels: { alertname: 'Alert1', severity: 'critical' },
      startsAt: '2024-01-01T00:00:00Z',
      fingerprint: 'aaa',
    })
    const b = createMockAlert({
      labels: { alertname: 'Alert2', severity: 'critical' },
      startsAt: '2024-01-01T00:00:00Z',
      fingerprint: 'bbb',
    })
    expect(sortAlerts(a, b)).toBeLessThan(0)
    expect(sortAlerts(b, a)).toBeGreaterThan(0)
  })
})

describe('getInterestingLabelBadges', () => {
  it('returns namespace, pod, service badges', () => {
    const alert = createMockAlert({
      labels: {
        alertname: 'TestAlert',
        namespace: 'default',
        pod: 'my-pod',
        service: 'my-service',
      },
    })
    const badges = getInterestingLabelBadges(alert)
    expect(badges).toEqual([
      'namespace=default',
      'pod=my-pod',
      'service=my-service',
    ])
  })

  it('skips missing labels', () => {
    const alert = createMockAlert({
      labels: {
        alertname: 'TestAlert',
        namespace: 'default',
        job: 'my-job',
      },
    })
    const badges = getInterestingLabelBadges(alert)
    expect(badges).toEqual(['namespace=default', 'job=my-job'])
  })

  it('limits to 3 badges', () => {
    const alert = createMockAlert({
      labels: {
        alertname: 'TestAlert',
        namespace: 'default',
        pod: 'my-pod',
        service: 'my-service',
        job: 'my-job',
        instance: 'my-instance',
      },
    })
    const badges = getInterestingLabelBadges(alert)
    expect(badges.length).toBe(3)
  })

  it('returns empty array when no interesting labels', () => {
    const alert = createMockAlert({
      labels: { alertname: 'TestAlert' },
    })
    const badges = getInterestingLabelBadges(alert)
    expect(badges).toEqual([])
  })
})
