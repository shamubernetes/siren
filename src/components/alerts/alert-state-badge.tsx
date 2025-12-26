import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { Badge } from '@/components/ui/badge'
import { getAlertKind } from './utils'

type AlertStateBadgeProps = {
  alert: AlertmanagerAlert
}

export function AlertStateBadge({ alert }: AlertStateBadgeProps) {
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
