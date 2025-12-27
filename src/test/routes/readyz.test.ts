import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { checkReadiness } from '@/lib/health/health-check'
import { Route } from '@/routes/readyz'

const mockCheckReadiness = vi.fn()

vi.mock('@/lib/health/health-check', () => ({
  checkReadiness: (...args: Parameters<typeof checkReadiness>) =>
    mockCheckReadiness(...args),
}))

function getRouteHandler() {
  const handlers = Route.options.server?.handlers
  if (!handlers || typeof handlers !== 'object') {
    throw new Error('Server handlers not defined for /readyz')
  }

  const getHandler = handlers.GET
  if (!getHandler) {
    throw new Error('GET handler not defined for /readyz')
  }

  return getHandler
}

function createMockHandlerContext(signal?: AbortSignal) {
  const request = new Request('http://localhost/readyz', {
    method: 'GET',
    signal,
  })

  return {
    request,
    context: undefined,
    params: {},
    pathname: '/readyz',
    next: async () => ({ isNext: false, context: undefined }),
  }
}

describe('readyz route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 when healthy', async () => {
    mockCheckReadiness.mockResolvedValue({
      healthy: true,
      message: 'Ready',
      configValid: true,
      alertmanagerReachable: true,
      alertmanagerLatencyMs: 50,
    })

    const handler = getRouteHandler()
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    const ctx = createMockHandlerContext()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler(ctx as any)

    if (!(response instanceof Response)) {
      throw new Error('Handler did not return a Response')
    }

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/plain')

    const text = await response.text()
    expect(text).toBe('ready')
  })

  it('returns 503 when not healthy - missing config', async () => {
    mockCheckReadiness.mockResolvedValue({
      healthy: false,
      message: 'Missing or invalid ALERTMANAGER_BASE_URL',
      configValid: false,
    })

    const handler = getRouteHandler()
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    const ctx = createMockHandlerContext()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler(ctx as any)

    if (!(response instanceof Response)) {
      throw new Error('Handler did not return a Response')
    }

    expect(response.status).toBe(503)
    expect(response.headers.get('Content-Type')).toBe('text/plain')

    const text = await response.text()
    expect(text).toBe('Missing or invalid ALERTMANAGER_BASE_URL')
  })

  it('returns 503 when not healthy - alertmanager unreachable', async () => {
    mockCheckReadiness.mockResolvedValue({
      healthy: false,
      message: 'Alertmanager unreachable: Timeout',
      configValid: true,
      alertmanagerReachable: false,
      alertmanagerLatencyMs: 2000,
    })

    const handler = getRouteHandler()
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    const ctx = createMockHandlerContext()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler(ctx as any)

    if (!(response instanceof Response)) {
      throw new Error('Handler did not return a Response')
    }

    expect(response.status).toBe(503)
    expect(response.headers.get('Content-Type')).toBe('text/plain')

    const text = await response.text()
    expect(text).toBe('Alertmanager unreachable: Timeout')
  })

  it('passes abort signal to checkReadiness', async () => {
    const abortController = new AbortController()
    mockCheckReadiness.mockResolvedValue({
      healthy: true,
      message: 'Ready',
      configValid: true,
      alertmanagerReachable: true,
    })

    const handler = getRouteHandler()
    if (!handler) {
      throw new Error('Handler is undefined')
    }
    const ctx = createMockHandlerContext(abortController.signal)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await handler(ctx as any)

    expect(mockCheckReadiness).toHaveBeenCalled()
    const callArgs = mockCheckReadiness.mock.calls[0]
    expect(callArgs[0]).toBeInstanceOf(AbortSignal)
  })
})

