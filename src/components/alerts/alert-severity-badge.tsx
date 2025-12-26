import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SeverityKind = 'critical' | 'warning' | 'info' | 'none' | 'unknown'

function normalizeSeverity(severity: string | undefined): SeverityKind {
  const raw = (severity ?? '').trim().toLowerCase()

  if (raw === 'critical' || raw === 'crit') {
    return 'critical'
  }

  if (raw === 'warning' || raw === 'warn') {
    return 'warning'
  }

  if (raw === 'info' || raw === 'informational') {
    return 'info'
  }

  if (!raw) {
    return 'unknown'
  }

  return 'none'
}

export function AlertSeverityBadge({ severity }: { severity?: string }) {
  const kind = normalizeSeverity(severity)

  const label =
    kind === 'critical'
      ? 'Critical'
      : kind === 'warning'
        ? 'Warning'
        : kind === 'info'
          ? 'Info'
          : kind === 'none'
            ? (severity ?? 'None')
            : 'Unknown'

  const className =
    kind === 'critical'
      ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
      : kind === 'warning'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
        : kind === 'info'
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300'
          : kind === 'none'
            ? ''
            : 'border-muted-foreground/20 bg-muted/50 text-muted-foreground'

  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {label}
    </Badge>
  )
}
