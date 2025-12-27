import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { fetchAlertmanagerAlerts } from '@/lib/alertmanager/alertmanager-client'
import { AlertsDashboard } from '@/components/alerts/alerts-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

const REFRESH_INTERVAL_STORAGE_KEY = 'alerts-refresh-interval'
const DEFAULT_REFRESH_INTERVAL = 30_000

function getStoredRefreshInterval(): number | null | undefined {
  if (globalThis.window === undefined) {
    return
  }

  if (typeof localStorage?.getItem !== 'function') {
    return
  }

  try {
    const stored = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY)
    if (stored === null) {
      return DEFAULT_REFRESH_INTERVAL
    }
    if (stored === 'null') {
      return null
    }

    const parsed = Number.parseInt(stored, 10)
    return Number.isNaN(parsed) ? DEFAULT_REFRESH_INTERVAL : parsed
  } catch {
    return
  }
}

export const Route = createFileRoute('/alerts')({
  loader: async () => {
    const alerts = await fetchAlertmanagerAlerts()
    return { alerts, nowMs: Date.now() }
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
  const { alerts, nowMs } = Route.useLoaderData()

  const [refreshInterval, setRefreshInterval] = useState<number | null>(
    DEFAULT_REFRESH_INTERVAL,
  )

  useEffect(() => {
    const stored = getStoredRefreshInterval()
    if (stored === undefined) {
      return
    }

    setRefreshInterval(stored)
  }, [])

  const handleRefresh = useCallback(() => {
    void router.invalidate()
  }, [router])

  const handleRefreshIntervalChange = useCallback((interval: number | null) => {
    setRefreshInterval(interval)

    if (globalThis.window === undefined) {
      return
    }
    if (typeof localStorage?.setItem !== 'function') {
      return
    }

    try {
      if (interval === null) {
        localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, 'null')
        return
      }

      localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(interval))
    } catch {
      // ignore write errors (e.g. private mode / disabled storage)
    }
  }, [])

  useEffect(() => {
    if (refreshInterval === null) {
      return
    }

    const intervalId = globalThis.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      void router.invalidate()
    }, refreshInterval)

    return () => {
      globalThis.clearInterval(intervalId)
    }
  }, [router, refreshInterval])

  return (
    <AlertsDashboard
      alerts={alerts}
      nowMs={nowMs}
      onRefresh={handleRefresh}
      refreshInterval={refreshInterval}
      onRefreshIntervalChange={handleRefreshIntervalChange}
    />
  )
}
