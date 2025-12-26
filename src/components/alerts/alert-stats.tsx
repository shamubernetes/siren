import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertCounts } from './types'

type AlertStatsProps = {
  counts: AlertCounts
}

export function AlertStats({ counts }: AlertStatsProps) {
  return (
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
  )
}
