import { Link } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { AlertSeverityBadge } from '@/components/alerts/alert-severity-badge'
import { AlertStateBadge } from '@/components/alerts/alert-state-badge'
import { CopyAlertLinkButton } from '@/components/alerts/copy-alert-link-button'
import { SilenceAlertButton } from '@/components/alerts/silence-alert-button'
import { useSilenceState } from '@/components/alerts/use-silence-state'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { AlertGroup } from './types'
import { formatAgeShort, getAlertSummary } from './utils'

type AlertGroupCardProps = {
  group: AlertGroup
  nowMs: number
  isExpanded: boolean
  onExpandedChange: (alertname: string, isExpanded: boolean) => void
  onRefresh: () => void
}

function getGroupContentId(alertname: string) {
  const slug = alertname
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

  return `alert-group-${slug || 'group'}`
}

export function AlertGroupCard({
  group,
  nowMs,
  isExpanded,
  onExpandedChange,
  onRefresh,
}: AlertGroupCardProps) {
  const previewAlert = group.alerts[0]
  const contentId = getGroupContentId(group.alertname)
  const hasMoreInstances = group.alerts.length > 1

  // Silence state for the preview alert (used in collapsed view)
  const previewSilenceState = useSilenceState(previewAlert, onRefresh)

  function handleToggleExpanded() {
    onExpandedChange(group.alertname, !isExpanded)
  }

  return (
    <Card
      className={cn(
        'gap-3 py-3 sm:gap-4 sm:py-4',
        isExpanded ? null : 'py-2 sm:py-3',
      )}
    >
      <CardHeader
        className={cn('pb-2 sm:pb-3', isExpanded ? null : 'pb-1 sm:pb-2')}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            aria-label={`Toggle alert group ${group.alertname}`}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            onClick={handleToggleExpanded}
          >
            <div className="min-w-0 select-none">
              <CardTitle className="truncate text-sm sm:text-base">
                {group.alertname}
              </CardTitle>
              <div className="mt-1 text-xs text-muted-foreground">
                {group.alerts.length} instance
                {group.alerts.length === 1 ? '' : 's'}
              </div>
            </div>

            {!isExpanded && previewAlert ? (
              <div className="ml-auto hidden items-center gap-2 self-center sm:flex">
                {hasMoreInstances ? (
                  <Badge variant="secondary">+{group.alerts.length - 1}</Badge>
                ) : null}
                <AlertSeverityBadge severity={previewAlert.labels.severity} />
                <AlertStateBadge
                  alert={previewAlert}
                  optimisticSilenced={previewSilenceState.optimisticSilenced}
                />
                <span className="text-xs text-muted-foreground">
                  {formatAgeShort(previewAlert.startsAt, nowMs)}
                </span>
              </div>
            ) : null}
          </button>

          <div className="flex items-center gap-2">
            {!isExpanded && previewAlert ? (
              <div className="hidden items-center gap-2 sm:flex">
                <SilenceAlertButton
                  alert={previewAlert}
                  silenceState={previewSilenceState}
                />
                <CopyAlertLinkButton fingerprint={previewAlert.fingerprint} />
                <Link
                  to="/a/$fingerprint"
                  params={{ fingerprint: previewAlert.fingerprint }}
                  aria-label="Open alert details"
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                  })}
                >
                  Details
                </Link>
              </div>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleExpanded}
              aria-label={
                isExpanded ? 'Collapse alert group' : 'Expand alert group'
              }
              aria-expanded={isExpanded}
              aria-controls={contentId}
            >
              <ChevronDownIcon
                className={cn(
                  'size-4 transition-transform',
                  isExpanded ? 'rotate-180' : 'rotate-0',
                )}
              />
            </Button>
          </div>
        </div>

        {!isExpanded && previewAlert ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm sm:hidden">
            {hasMoreInstances ? (
              <Badge variant="secondary">+{group.alerts.length - 1}</Badge>
            ) : null}
            <AlertSeverityBadge severity={previewAlert.labels.severity} />
            <AlertStateBadge
              alert={previewAlert}
              optimisticSilenced={previewSilenceState.optimisticSilenced}
            />
            <span className="text-muted-foreground">
              {formatAgeShort(previewAlert.startsAt, nowMs)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <SilenceAlertButton
                alert={previewAlert}
                silenceState={previewSilenceState}
              />
              <CopyAlertLinkButton fingerprint={previewAlert.fingerprint} />
              <Link
                to="/a/$fingerprint"
                params={{ fingerprint: previewAlert.fingerprint }}
                aria-label="Open alert details"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Details
              </Link>
            </div>
          </div>
        ) : null}
      </CardHeader>

      {isExpanded ? (
        <CardContent id={contentId} className="px-3 pt-0 sm:px-4">
          {/* Mobile layout: stacked instance cards */}
          <div className="space-y-3 sm:hidden">
            {group.alerts.map((alert) => (
              <MobileAlertInstance
                key={alert.fingerprint}
                alert={alert}
                nowMs={nowMs}
                onRefresh={onRefresh}
              />
            ))}
          </div>

          {/* Desktop layout: table */}
          <div className="hidden sm:block">
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
                  <AlertRow
                    key={alert.fingerprint}
                    alert={alert}
                    nowMs={nowMs}
                    onRefresh={onRefresh}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}

type AlertRowProps = {
  alert: AlertmanagerAlert
  nowMs: number
  onRefresh: () => void
}

function AlertRow({ alert, nowMs, onRefresh }: AlertRowProps) {
  const silenceState = useSilenceState(alert, onRefresh)

  return (
    <TableRow>
      <TableCell className="max-w-0">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {getAlertSummary(alert)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <AlertSeverityBadge severity={alert.labels.severity} />
      </TableCell>
      <TableCell>
        <AlertStateBadge
          alert={alert}
          optimisticSilenced={silenceState.optimisticSilenced}
        />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatAgeShort(alert.startsAt, nowMs)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <SilenceAlertButton alert={alert} silenceState={silenceState} />
          <CopyAlertLinkButton fingerprint={alert.fingerprint} />
          <Link
            to="/a/$fingerprint"
            params={{ fingerprint: alert.fingerprint }}
            aria-label="Open alert details"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Details
          </Link>
        </div>
      </TableCell>
    </TableRow>
  )
}

type MobileAlertInstanceProps = {
  alert: AlertmanagerAlert
  nowMs: number
  onRefresh: () => void
}

function MobileAlertInstance({
  alert,
  nowMs,
  onRefresh,
}: MobileAlertInstanceProps) {
  const silenceState = useSilenceState(alert, onRefresh)

  return (
    <div className="rounded-lg border bg-card p-2.5 sm:p-3">
      <div className="space-y-2.5 sm:space-y-3">
        {/* Summary */}
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-medium">
            {getAlertSummary(alert)}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2.5 text-sm sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Severity:</span>
            <AlertSeverityBadge severity={alert.labels.severity} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <AlertStateBadge
              alert={alert}
              optimisticSilenced={silenceState.optimisticSilenced}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Age:</span>
            <span className="text-muted-foreground">
              {formatAgeShort(alert.startsAt, nowMs)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <SilenceAlertButton alert={alert} silenceState={silenceState} />
          <CopyAlertLinkButton fingerprint={alert.fingerprint} />
          <Link
            to="/a/$fingerprint"
            params={{ fingerprint: alert.fingerprint }}
            aria-label="Open alert details"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
