import { Link } from '@tanstack/react-router'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { AlertSeverityBadge } from '@/components/alerts/alert-severity-badge'
import { AlertStateBadge } from '@/components/alerts/alert-state-badge'
import { CopyAlertLinkButton } from '@/components/alerts/copy-alert-link-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AlertGroup } from './types'
import {
  formatAgeShort,
  getAlertSummary,
  getInterestingLabelBadges,
} from './utils'

type AlertGroupCardProps = {
  group: AlertGroup
  nowMs: number
}

export function AlertGroupCard({ group, nowMs }: AlertGroupCardProps) {
  return (
    <Card>
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
              <AlertRow key={alert.fingerprint} alert={alert} nowMs={nowMs} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

type AlertRowProps = {
  alert: AlertmanagerAlert
  nowMs: number
}

function AlertRow({ alert, nowMs }: AlertRowProps) {
  return (
    <TableRow>
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
        <AlertSeverityBadge severity={alert.labels.severity} />
      </TableCell>
      <TableCell>
        <AlertStateBadge alert={alert} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatAgeShort(alert.startsAt, nowMs)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <CopyAlertLinkButton fingerprint={alert.fingerprint} />
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
  )
}
