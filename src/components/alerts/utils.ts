import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import type { AlertView, WatchdogStatus } from './types'

export function getAlertKind(alert: AlertmanagerAlert): AlertView {
  const silenced = (alert.status.silencedBy?.length ?? 0) > 0
  if (silenced) {
    return 'silenced'
  }

  const inhibited = (alert.status.inhibitedBy?.length ?? 0) > 0
  if (inhibited) {
    return 'inhibited'
  }

  if (alert.status.state === 'active') {
    return 'firing'
  }

  return 'all'
}

export function getAlertName(alert: AlertmanagerAlert) {
  return alert.labels.alertname ?? 'Alert'
}

export function isWatchdogAlert(alert: AlertmanagerAlert) {
  return (alert.labels.alertname ?? '').trim() === 'Watchdog'
}

export function getWatchdogStatus(
  alerts: Array<AlertmanagerAlert>,
): WatchdogStatus {
  if (alerts.length === 0) {
    return {
      description:
        'No Watchdog alert found. This usually indicates Alertmanager is not receiving heartbeat signals.',
      instances: 0,
      lastUpdatedAt: new Date(0).toISOString(),
      statusBadgeClassName:
        'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300',
      statusLabel: 'Missing',
    }
  }

  let lastUpdatedAt = alerts[0].updatedAt ?? alerts[0].startsAt
  let lastUpdatedMs = Date.parse(lastUpdatedAt)
  if (Number.isNaN(lastUpdatedMs)) {
    lastUpdatedAt = new Date(0).toISOString()
    lastUpdatedMs = 0
  }

  for (const alert of alerts) {
    const next = alert.updatedAt ?? alert.startsAt
    const nextMs = Date.parse(next)
    if (Number.isNaN(nextMs)) {
      continue
    }

    if (nextMs > lastUpdatedMs) {
      lastUpdatedAt = next
      lastUpdatedMs = nextMs
    }
  }

  const kinds = new Set(alerts.map((alert) => getAlertKind(alert)))
  const isFiring = kinds.has('firing')
  const isSilenced = kinds.has('silenced')
  const isInhibited = kinds.has('inhibited')

  if (isFiring) {
    return {
      description: 'Heartbeat is firing properly (this is expected).',
      instances: alerts.length,
      lastUpdatedAt,
      statusBadgeClassName:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
      statusLabel: 'Firing',
    }
  }

  if (isSilenced) {
    return {
      description: 'Heartbeat is currently silenced.',
      instances: alerts.length,
      lastUpdatedAt,
      statusBadgeClassName:
        'border-zinc-500/30 bg-zinc-500/10 text-zinc-800 dark:text-zinc-300',
      statusLabel: 'Silenced',
    }
  }

  if (isInhibited) {
    return {
      description: 'Heartbeat is currently inhibited.',
      instances: alerts.length,
      lastUpdatedAt,
      statusBadgeClassName:
        'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300',
      statusLabel: 'Inhibited',
    }
  }

  return {
    description: 'Heartbeat alert is present.',
    instances: alerts.length,
    lastUpdatedAt,
    statusBadgeClassName:
      'border-muted-foreground/20 bg-muted/50 text-muted-foreground',
    statusLabel: 'Present',
  }
}

export function getAlertSummary(alert: AlertmanagerAlert) {
  return (
    alert.annotations.summary ?? alert.annotations.description ?? 'No summary'
  )
}

export function alertMatchesQuery(alert: AlertmanagerAlert, query: string) {
  const haystack = [
    ...Object.entries(alert.labels).flatMap(([key, value]) => [
      key,
      value ?? '',
    ]),
    ...Object.entries(alert.annotations).flatMap(([key, value]) => [
      key,
      value ?? '',
    ]),
    alert.fingerprint,
    alert.generatorURL ?? '',
    alert.status.state,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

export function formatAgeShort(startsAt: string, nowMs: number = Date.now()) {
  const startMs = Date.parse(startsAt)
  if (Number.isNaN(startMs)) {
    return '—'
  }

  const deltaMs = nowMs - startMs
  const seconds = Math.floor(deltaMs / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }

  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function getSeverityRank(severity?: string | null) {
  const sev = (severity ?? '').trim().toLowerCase()
  if (sev === 'critical' || sev === 'crit') {
    return 0
  }

  if (sev === 'warning' || sev === 'warn') {
    return 1
  }

  if (sev === 'info' || sev === 'informational') {
    return 2
  }

  return 3
}

export function sortAlerts(a: AlertmanagerAlert, b: AlertmanagerAlert) {
  const sev =
    getSeverityRank(a.labels.severity) - getSeverityRank(b.labels.severity)
  if (sev !== 0) {
    return sev
  }

  const start = Date.parse(a.startsAt) - Date.parse(b.startsAt)
  if (!Number.isNaN(start) && start !== 0) {
    return start
  }

  return a.fingerprint.localeCompare(b.fingerprint)
}

export function getInterestingLabelBadges(alert: AlertmanagerAlert) {
  const candidates = [
    ['namespace', alert.labels.namespace],
    ['pod', alert.labels.pod],
    ['service', alert.labels.service],
    ['job', alert.labels.job],
    ['instance', alert.labels.instance],
  ] as const

  const badges: Array<string> = []

  for (const [key, value] of candidates) {
    if (!value) {
      continue
    }

    badges.push(`${key}=${value}`)
    if (badges.length >= 3) {
      break
    }
  }

  return badges
}
