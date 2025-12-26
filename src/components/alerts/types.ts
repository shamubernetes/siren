import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'

export type AlertView = 'all' | 'firing' | 'silenced' | 'inhibited'

export type AlertsDashboardProps = {
  alerts: Array<AlertmanagerAlert>
  nowMs: number
  onRefresh: () => void
  refreshInterval: number | null
  onRefreshIntervalChange: (interval: number | null) => void
}

export type AlertCounts = {
  firing: number
  silenced: number
  inhibited: number
}

export type AlertGroup = {
  alertname: string
  alerts: Array<AlertmanagerAlert>
}

export type WatchdogStatus = {
  description: string
  instances: number
  lastUpdatedAt: string
  statusBadgeClassName: string
  statusLabel: string
}
