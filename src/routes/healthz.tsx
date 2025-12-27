import { createFileRoute, Link } from '@tanstack/react-router'
import { checkReadiness } from '@/lib/health/health-check'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/healthz')({
  loader: async ({ abortController }) => {
    const status = await checkReadiness(abortController.signal)
    return status
  },
  component: HealthzRoute,
})

function HealthzRoute() {
  const status = Route.useLoaderData()

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Health Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Current health status of Siren and its dependencies
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Siren Process</CardTitle>
            <CardDescription>Application runtime status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Healthy</Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Application is running and responding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>ALERTMANAGER_BASE_URL validation</CardDescription>
          </CardHeader>
          <CardContent>
            {status.configValid ? (
              <>
                <Badge variant="default">Valid</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Environment variable is configured correctly
                </p>
              </>
            ) : (
              <>
                <Badge variant="destructive">Invalid</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  {status.message}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertmanager</CardTitle>
            <CardDescription>Upstream connectivity</CardDescription>
          </CardHeader>
          <CardContent>
            {status.alertmanagerReachable ? (
              <>
                <Badge variant="default">Reachable</Badge>
                {status.alertmanagerLatencyMs !== undefined && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Response time: {status.alertmanagerLatencyMs}ms
                  </p>
                )}
              </>
            ) : (
              <>
                <Badge variant="destructive">Unreachable</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  {status.message}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Status</CardTitle>
            <CardDescription>Readiness for traffic</CardDescription>
          </CardHeader>
          <CardContent>
            {status.healthy ? (
              <>
                <Badge variant="default">Ready</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  All checks passed
                </p>
              </>
            ) : (
              <>
                <Badge variant="destructive">Not Ready</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  {status.message}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Kubernetes Probes</CardTitle>
            <CardDescription>
              Use these endpoints for liveness and readiness probes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Liveness Probe</h3>
              <code className="block p-3 bg-muted rounded-md text-xs font-mono">
                httpGet: path: /livez port: 3000
              </code>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Readiness Probe</h3>
              <code className="block p-3 bg-muted rounded-md text-xs font-mono">
                httpGet: path: /readyz port: 3000
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Link to="/alerts" className={buttonVariants({ variant: 'outline' })}>
          View Alerts
        </Link>
      </div>
    </main>
  )
}
