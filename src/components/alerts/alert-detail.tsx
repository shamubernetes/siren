import { ExternalLinkIcon } from 'lucide-react'

import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { extractAlertExternalLinks } from '@/lib/alertmanager/alert-link-utils'
import { AlertSeverityBadge } from '@/components/alerts/alert-severity-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

type AlertDetailProps = {
  alert: AlertmanagerAlert
}

export function AlertDetail({ alert }: AlertDetailProps) {
  const alertname = alert.labels.alertname ?? 'Alert'
  const summary =
    alert.annotations.summary ?? alert.annotations.description ?? 'No summary'

  const links = extractAlertExternalLinks(alert)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{alertname}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AlertSeverityBadge severity={alert.labels.severity} />
            <Badge variant="secondary">{alert.status.state}</Badge>
            <Badge variant="outline" className="font-mono">
              {alert.fingerprint}
            </Badge>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            {summary}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Labels</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-64 pr-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(alert.labels)
                  .filter(([, value]) => Boolean(value))
                  .toSorted(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <Badge key={key} variant="outline">
                      {key}={value}
                    </Badge>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Annotations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-64 pr-3">
              <dl className="grid gap-3">
                {Object.entries(alert.annotations)
                  .filter(([, value]) => Boolean(value))
                  .toSorted(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <div key={key} className="grid gap-1">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {key}
                      </dt>
                      <dd className="text-sm break-words">{value}</dd>
                    </div>
                  ))}
              </dl>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {links.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No links found.
              </div>
            ) : (
              <div className="grid gap-2">
                {links.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant="outline"
                    className="justify-start"
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${link.label} in a new tab`}
                    >
                      <ExternalLinkIcon className="mr-2 size-4" />
                      {link.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Raw JSON</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <pre className="max-h-[28rem] overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
              {JSON.stringify(alert, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
