import { describe, expect, it } from 'vitest'
import { Route } from '@/routes/livez'

function getRouteHandler() {
  const handlers = Route.options.server?.handlers
  if (!handlers || typeof handlers !== 'object') {
    throw new Error('Server handlers not defined for /livez')
  }

  const getHandler = handlers.GET
  if (!getHandler) {
    throw new Error('GET handler not defined for /livez')
  }

  return getHandler
}

function createMockHandlerContext() {
  const request = new Request('http://localhost/livez', {
    method: 'GET',
  })

  return {
    request,
    context: undefined,
    params: {},
    pathname: '/livez',
    next: async () => ({ isNext: false, context: undefined }),
  }
}

describe('livez route', () => {
  it('returns 200 with ok message', async () => {
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
    expect(text).toBe('ok')
  })
})
