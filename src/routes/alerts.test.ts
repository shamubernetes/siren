import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { Route } from './alerts'
import { fetchAlertmanagerAlerts } from '@/lib/alertmanager/alertmanager-client'

vi.mock('@/lib/alertmanager/alertmanager-client', () => ({
  fetchAlertmanagerAlerts: vi.fn(),
}))

function getRouteLoader() {
  const loader = Route.options.loader
  if (!loader) {
    throw new Error('Route loader is not defined for /alerts')
  }
  return loader
}

type AlertsLoader = NonNullable<typeof Route.options.loader>
type AlertsLoaderContext = NonNullable<Parameters<AlertsLoader>[0]>
type AlertsParentMatch = Awaited<AlertsLoaderContext['parentMatchPromise']>

function createLoaderContext(): AlertsLoaderContext {
  const url = new URL('http://localhost/alerts')
  const params: AlertsLoaderContext['params'] = {}
  const parentMatchPromise: AlertsLoaderContext['parentMatchPromise'] =
    Promise.resolve({} as AlertsParentMatch)

  return {
    abortController: new AbortController(),
    preload: false,
    params,
    deps: {},
    context: {},
    location: {
      href: url.pathname,
      pathname: url.pathname,
      search: {},
      searchStr: '',
      state: { __TSR_index: 0 },
      hash: '',
      publicHref: url.pathname,
      url,
    },
    navigate: () => {},
    parentMatchPromise,
    cause: 'enter',
    route: Route,
  }
}

function createMockAlert(
  overrides?: Partial<AlertmanagerAlert>,
): AlertmanagerAlert {
  return {
    annotations: {},
    endsAt: '2024-01-01T00:00:00Z',
    fingerprint: 'test-fingerprint',
    labels: { alertname: 'TestAlert' },
    startsAt: '2024-01-01T00:00:00Z',
    status: { state: 'active' },
    ...overrides,
  }
}

describe('alerts route loader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns alerts and current timestamp', async () => {
    const mockAlerts = [
      createMockAlert({ fingerprint: 'alert-1' }),
      createMockAlert({ fingerprint: 'alert-2' }),
    ]

    vi.mocked(fetchAlertmanagerAlerts).mockResolvedValue(mockAlerts)

    const beforeMs = Date.now()
    const result = await getRouteLoader()(createLoaderContext())
    const afterMs = Date.now()

    expect(result.alerts).toEqual(mockAlerts)
    expect(result.nowMs).toBeGreaterThanOrEqual(beforeMs)
    expect(result.nowMs).toBeLessThanOrEqual(afterMs)
  })

  it('handles empty alerts array', async () => {
    vi.mocked(fetchAlertmanagerAlerts).mockResolvedValue([])

    const result = await getRouteLoader()(createLoaderContext())

    expect(result.alerts).toEqual([])
    expect(result.nowMs).toBeTypeOf('number')
  })

  it('propagates errors from fetchAlertmanagerAlerts', async () => {
    const error = new Error('Network error')
    vi.mocked(fetchAlertmanagerAlerts).mockRejectedValue(error)

    await expect(getRouteLoader()(createLoaderContext())).rejects.toThrow(
      'Network error',
    )
  })
})
