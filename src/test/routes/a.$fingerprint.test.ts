import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { Route } from '@/routes/a.$fingerprint'

vi.mock('@/lib/alertmanager/alertmanager-client', () => ({
  fetchAlertmanagerAlerts: vi.fn(),
}))

function getRouteLoader() {
  const loader = Route.options.loader
  if (!loader) {
    throw new Error('Route loader is not defined for /a/$fingerprint')
  }
  return loader
}

type AlertDetailLoader = NonNullable<typeof Route.options.loader>
type AlertDetailLoaderContext = Parameters<AlertDetailLoader>[0]
type AlertDetailParentMatch = Awaited<
  AlertDetailLoaderContext['parentMatchPromise']
>

function createLoaderContext(fingerprint: string): AlertDetailLoaderContext {
  const url = new URL(`http://localhost/a/${fingerprint}`)
  const parentMatchPromise: AlertDetailLoaderContext['parentMatchPromise'] =
    Promise.resolve({} as AlertDetailParentMatch)

  return {
    abortController: new AbortController(),
    preload: false,
    params: { fingerprint },
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

describe('alert detail route loader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns matching alert when fingerprint exists', async () => {
    const targetAlert = createMockAlert({ fingerprint: 'target-fingerprint' })
    const otherAlert = createMockAlert({ fingerprint: 'other-fingerprint' })
    const mockAlerts = [targetAlert, otherAlert]

    const { fetchAlertmanagerAlerts } =
      await import('@/lib/alertmanager/alertmanager-client')
    vi.mocked(fetchAlertmanagerAlerts).mockResolvedValue(mockAlerts)

    const result = await getRouteLoader()({
      ...createLoaderContext('target-fingerprint'),
    })

    expect(result.alert).toEqual(targetAlert)
    expect(result.fingerprint).toBe('target-fingerprint')
  })

  it('returns null alert when fingerprint does not exist', async () => {
    const mockAlerts = [
      createMockAlert({ fingerprint: 'other-fingerprint-1' }),
      createMockAlert({ fingerprint: 'other-fingerprint-2' }),
    ]

    const { fetchAlertmanagerAlerts } =
      await import('@/lib/alertmanager/alertmanager-client')
    vi.mocked(fetchAlertmanagerAlerts).mockResolvedValue(mockAlerts)

    const result = await getRouteLoader()({
      ...createLoaderContext('nonexistent-fingerprint'),
    })

    expect(result.alert).toBeNull()
    expect(result.fingerprint).toBe('nonexistent-fingerprint')
  })

  it('returns null alert when alerts array is empty', async () => {
    const { fetchAlertmanagerAlerts } =
      await import('@/lib/alertmanager/alertmanager-client')
    vi.mocked(fetchAlertmanagerAlerts).mockResolvedValue([])

    const result = await getRouteLoader()({
      ...createLoaderContext('any-fingerprint'),
    })

    expect(result.alert).toBeNull()
    expect(result.fingerprint).toBe('any-fingerprint')
  })

  it('propagates errors from fetchAlertmanagerAlerts', async () => {
    const { fetchAlertmanagerAlerts } =
      await import('@/lib/alertmanager/alertmanager-client')
    const error = new Error('Network error')
    vi.mocked(fetchAlertmanagerAlerts).mockRejectedValue(error)

    await expect(
      getRouteLoader()({
        ...createLoaderContext('test-fingerprint'),
      }),
    ).rejects.toThrow('Network error')
  })
})

