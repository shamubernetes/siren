import { Badge } from '@/components/ui/badge'
import type { WatchdogStatus as WatchdogStatusType } from './types'
import { formatAgeShort } from './utils'

type WatchdogStatusProps = {
  status: WatchdogStatusType
  nowMs: number
}

export function WatchdogStatus({ status, nowMs }: WatchdogStatusProps) {
  return (
    <footer className="mt-4 sm:mt-6">
      <div
        className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3"
        aria-label="Watchdog heartbeat status"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Watchdog
          </span>
          <Badge variant="outline" className={status.statusBadgeClassName}>
            {status.statusLabel}
          </Badge>
          <span className="truncate text-xs text-muted-foreground">
            {status.description}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {status.instances} instance
            {status.instances === 1 ? '' : 's'}
          </Badge>
          <Badge variant="secondary">
            Last update: {formatAgeShort(status.lastUpdatedAt, nowMs)}
          </Badge>
        </div>
      </div>
    </footer>
  )
}
