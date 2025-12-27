import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertCounts } from './types'

type AlertStatsProps = {
  counts: AlertCounts
}

export function AlertStats({ counts }: AlertStatsProps) {
  return (
    <section className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
      <Card className="gap-2 py-3 sm:gap-4 sm:py-4">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
            Firing
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold leading-none sm:text-3xl">
          {counts.firing}
        </CardContent>
      </Card>
      <Card className="gap-2 py-3 sm:gap-4 sm:py-4">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
            Silenced
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold leading-none sm:text-3xl">
          {counts.silenced}
        </CardContent>
      </Card>
      <Card className="gap-2 py-3 sm:gap-4 sm:py-4">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
            Inhibited
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold leading-none sm:text-3xl">
          {counts.inhibited}
        </CardContent>
      </Card>
    </section>
  )
}
