import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

import { fetchAlertmanagerAlerts } from '@/lib/alertmanager/alertmanager-client'
import { AlertDetail } from '@/components/alerts/alert-detail'
import { CopyAlertLinkButton } from '@/components/alerts/copy-alert-link-button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/a/$fingerprint')({
  loader: async ({ params }) => {
    const alerts = await fetchAlertmanagerAlerts()
    const alert =
      alerts.find((a) => a.fingerprint === params.fingerprint) ?? null

    return {
      alert,
      fingerprint: params.fingerprint,
    }
  },
  pendingComponent: AlertPending,
  errorComponent: AlertError,
  component: AlertRoute,
})

function AlertPending() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="mt-6 grid gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

function AlertError({ error }: { error: Error }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-xl font-semibold">Alert</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <div className="mt-6">
        <Link to="/alerts" className={buttonVariants({ variant: 'outline' })}>
          Back to alerts
        </Link>
      </div>
    </main>
  )
}

function AlertRoute() {
  const router = useRouter()
  const { alert, fingerprint } = Route.useLoaderData()

  const handleRefresh = useCallback(() => {
    void router.invalidate()
  }, [router])

  if (!alert) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <Link to="/alerts" className={buttonVariants({ variant: 'outline' })}>
            Back
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="mt-6 text-xl font-semibold">Alert not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No current alert matches fingerprint{' '}
          <code className="font-mono">{fingerprint}</code>.
        </p>
      </main>
    )
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-4 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/alerts" className={buttonVariants({ variant: 'outline' })}>
            Back
          </Link>
          <div className="flex items-center gap-2">
            <CopyAlertLinkButton fingerprint={alert.fingerprint} />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <AlertDetail alert={alert} onRefresh={handleRefresh} />
    </div>
  )
}
