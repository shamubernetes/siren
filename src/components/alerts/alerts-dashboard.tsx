import { Link } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { AlertSeverityBadge } from '@/components/alerts/alert-severity-badge'
import { CopyAlertLinkButton } from '@/components/alerts/copy-alert-link-button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type SelectRootChangeEventDetails } from 'node_modules/@base-ui/react/esm/select/root/SelectRoot'

type AlertView = 'all' | 'firing' | 'silenced' | 'inhibited'

type AlertsDashboardProps = {
  alerts: Array<AlertmanagerAlert>
  onRefresh: () => void
}

type AlertCounts = {
  firing: number
  silenced: number
  inhibited: number
}

type AlertGroup = {
  alertname: string
  alerts: Array<AlertmanagerAlert>
}

export function AlertsDashboard({ alerts, onRefresh }: AlertsDashboardProps) {
  const [searchText, setSearchText] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [view, setView] = useState<AlertView>('all')

  const severityOptions = useMemo(() => {
    const set = new Set<string>()

    for (const alert of alerts) {
      const sev = (alert.labels.severity ?? '').trim()
      if (sev) {
        set.add(sev)
      }
    }

    return Array.from(set).toSorted((a: string, b: string) =>
      a.localeCompare(b),
    )
  }, [alerts])

  const counts = useMemo((): AlertCounts => {
    let firing = 0
    let silenced = 0
    let inhibited = 0

    for (const alert of alerts) {
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
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    const q = searchText.trim().toLowerCase()

    return alerts.filter((alert) => {
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
  }, [alerts, searchText, severityFilter, view])

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

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value)
    },
    [],
  )

  const handleSeverityChange = useCallback((value: string) => {
    setSeverityFilter(value)
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

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Firing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {counts.firing}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Silenced
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {counts.silenced}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inhibited
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {counts.inhibited}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search alerts"
              placeholder="Search labels / annotations…"
              value={searchText}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Tabs value={view} onValueChange={handleViewChange}>
              <TabsList aria-label="Alert state filter">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="firing">Firing</TabsTrigger>
                <TabsTrigger value="silenced">Silenced</TabsTrigger>
                <TabsTrigger value="inhibited">Inhibited</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              value={severityFilter}
              onValueChange={
                handleSeverityChange as (
                  value: string | null,
                  eventDetails: SelectRootChangeEventDetails,
                ) => void
              }
            >
              <SelectTrigger
                className="w-full sm:w-44"
                aria-label="Filter by severity"
              >
                <SelectValue>Severity</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {severityOptions.map((sev: string) => (
                  <SelectItem key={sev} value={sev}>
                    {sev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {filteredAlerts.length}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">{alerts.length}</span>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No alerts match the current filters.
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.alertname}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {group.alertname}
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {group.alerts.length} instance
                      {group.alerts.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[42%]">Summary</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.alerts.map((alert) => (
                      <TableRow key={alert.fingerprint}>
                        <TableCell className="max-w-0">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {getAlertSummary(alert)}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {getInterestingLabelBadges(alert).map((badge) => (
                                <Badge key={badge} variant="secondary">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertSeverityBadge
                            severity={alert.labels.severity}
                          />
                        </TableCell>
                        <TableCell>
                          <AlertStateBadge alert={alert} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatAgeShort(alert.startsAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <CopyAlertLinkButton
                              fingerprint={alert.fingerprint}
                            />
                            <Button variant="outline" size="sm">
                              <Link
                                to="/a/$fingerprint"
                                params={{ fingerprint: alert.fingerprint }}
                                aria-label="Open alert details"
                              >
                                Details
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}

function AlertStateBadge({ alert }: { alert: AlertmanagerAlert }) {
  const kind = getAlertKind(alert)

  const label =
    kind === 'firing'
      ? 'Firing'
      : kind === 'silenced'
        ? 'Silenced'
        : kind === 'inhibited'
          ? 'Inhibited'
          : 'Other'

  const className =
    kind === 'firing'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
      : kind === 'silenced'
        ? 'border-zinc-500/30 bg-zinc-500/10 text-zinc-800 dark:text-zinc-300'
        : kind === 'inhibited'
          ? 'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300'
          : 'border-muted-foreground/20 bg-muted/50 text-muted-foreground'

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function getAlertKind(alert: AlertmanagerAlert): AlertView {
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

function getAlertName(alert: AlertmanagerAlert) {
  return alert.labels.alertname ?? 'Alert'
}

function getAlertSummary(alert: AlertmanagerAlert) {
  return (
    alert.annotations.summary ?? alert.annotations.description ?? 'No summary'
  )
}

function alertMatchesQuery(alert: AlertmanagerAlert, query: string) {
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

  return haystack.includes(query)
}

function formatAgeShort(startsAt: string) {
  const startMs = Date.parse(startsAt)
  if (Number.isNaN(startMs)) {
    return '—'
  }

  const deltaMs = Date.now() - startMs
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

function getSeverityRank(severity: string | undefined) {
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

function sortAlerts(a: AlertmanagerAlert, b: AlertmanagerAlert) {
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

function getInterestingLabelBadges(alert: AlertmanagerAlert) {
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
