import { useCallback, useMemo, useState } from 'react'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertFilters } from '@/components/alerts/alert-filters'
import { AlertGroupCard } from '@/components/alerts/alert-group-card'
import { AlertStats } from '@/components/alerts/alert-stats'
import { WatchdogStatus } from '@/components/alerts/watchdog-status'
import type {
  AlertCounts,
  AlertGroup,
  AlertView,
  AlertsDashboardProps,
} from '@/components/alerts/types'
import {
  alertMatchesQuery,
  getAlertKind,
  getAlertName,
  getWatchdogStatus,
  isWatchdogAlert,
  sortAlerts,
} from '@/components/alerts/utils'

export function AlertsDashboard({
  alerts,
  nowMs,
  onRefresh,
}: AlertsDashboardProps) {
  const watchdogAlerts = useMemo(
    () => alerts.filter((alert) => isWatchdogAlert(alert)),
    [alerts],
  )

  const nonWatchdogAlerts = useMemo(
    () => alerts.filter((alert) => !isWatchdogAlert(alert)),
    [alerts],
  )

  const [searchText, setSearchText] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [view, setView] = useState<AlertView>('all')

  const severityOptions = useMemo(() => {
    const set = new Set<string>()

    for (const alert of nonWatchdogAlerts) {
      const sev = (alert.labels.severity ?? '').trim()
      if (sev) {
        set.add(sev)
      }
    }

    return Array.from(set).toSorted((a: string, b: string) =>
      a.localeCompare(b),
    )
  }, [nonWatchdogAlerts])

  const counts = useMemo((): AlertCounts => {
    let firing = 0
    let silenced = 0
    let inhibited = 0

    for (const alert of nonWatchdogAlerts) {
      const kind = getAlertKind(alert)
      if (kind === 'silenced') {
        silenced += 1
        continue
      }

      if (kind === 'inhibited') {
        inhibited += 1
        continue
      }

      if (kind === 'firing') {
        firing += 1
      }
    }

    return { firing, silenced, inhibited }
  }, [nonWatchdogAlerts])

  const filteredAlerts = useMemo(() => {
    const q = searchText.trim().toLowerCase()

    return nonWatchdogAlerts.filter((alert) => {
      if (view !== 'all' && getAlertKind(alert) !== view) {
        return false
      }

      if (severityFilter !== 'all') {
        const sev = (alert.labels.severity ?? '').trim()
        if (sev !== severityFilter) {
          return false
        }
      }

      if (!q) {
        return true
      }

      return alertMatchesQuery(alert, q)
    })
  }, [nonWatchdogAlerts, searchText, severityFilter, view])

  const groups = useMemo((): Array<AlertGroup> => {
    const map = new Map<string, Array<AlertmanagerAlert>>()

    for (const alert of filteredAlerts) {
      const name = getAlertName(alert)
      const list = map.get(name)
      if (list) {
        list.push(alert)
      } else {
        map.set(name, [alert])
      }
    }

    const result: Array<AlertGroup> = Array.from(map.entries())
      .map(([alertname, groupAlerts]) => ({
        alertname,
        alerts: groupAlerts
          .slice()
          .toSorted((a: AlertmanagerAlert, b: AlertmanagerAlert) =>
            sortAlerts(a, b),
          ),
      }))
      .toSorted((a: AlertGroup, b: AlertGroup) =>
        a.alertname.localeCompare(b.alertname),
      )

    return result
  }, [filteredAlerts])

  const watchdogStatus = useMemo(
    () => getWatchdogStatus(watchdogAlerts),
    [watchdogAlerts],
  )

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value)
    },
    [],
  )

  const handleSeverityChange = useCallback((value: string | null) => {
    setSeverityFilter(value ?? 'all')
  }, [])

  const handleViewChange = useCallback((value: string) => {
    setView(value as AlertView)
  }, [])

  const handleRefreshClick = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Currently firing alerts from Alertmanager.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            onClick={handleRefreshClick}
            aria-label="Refresh alerts"
          >
            Refresh
          </Button>
        </div>
      </header>

      <AlertStats counts={counts} />

      <AlertFilters
        searchText={searchText}
        onSearchChange={handleSearchChange}
        view={view}
        onViewChange={handleViewChange}
        severityFilter={severityFilter}
        onSeverityChange={handleSeverityChange}
        severityOptions={severityOptions}
        filteredCount={filteredAlerts.length}
        totalCount={nonWatchdogAlerts.length}
      />

      <section className="mt-6 grid gap-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No alerts match the current filters.
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <AlertGroupCard key={group.alertname} group={group} nowMs={nowMs} />
          ))
        )}
      </section>

      <WatchdogStatus status={watchdogStatus} nowMs={nowMs} />
    </div>
  )
}
