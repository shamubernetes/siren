import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'

import { fetchAlertmanagerAlerts } from '@/lib/alertmanager/alertmanager-client'
import { AlertsDashboard } from '@/components/alerts/alerts-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/alerts')({
  loader: async () => {
    const alerts = await fetchAlertmanagerAlerts()
    return { alerts }
  },
  pendingComponent: AlertsPending,
  errorComponent: AlertsError,
  component: AlertsRoute,
})

function AlertsPending() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="mt-6">
        <Skeleton className="h-14" />
      </div>
      <div className="mt-6 grid gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

function AlertsError({ error }: { error: Error }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Alerts</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Check <code className="font-mono">ALERTMANAGER_BASE_URL</code> and that
        Alertmanager is reachable from the server.
      </p>
    </main>
  )
}

function AlertsRoute() {
  const router = useRouter()
  const { alerts } = Route.useLoaderData()

  const handleRefresh = useCallback(() => {
    void router.invalidate()
  }, [router])

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      void router.invalidate()
    }, 30_000)

    return () => {
      globalThis.clearInterval(intervalId)
    }
  }, [router])

  return <AlertsDashboard alerts={alerts} onRefresh={handleRefresh} />
}
