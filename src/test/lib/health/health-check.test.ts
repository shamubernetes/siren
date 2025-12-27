import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { checkReadiness } from '@/lib/health/health-check'

const originalEnv = process.env
const originalFetch = globalThis.fetch

describe('health-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    globalThis.fetch = originalFetch
  })

  describe('checkReadiness', () => {
    it('returns unhealthy when ALERTMANAGER_BASE_URL is missing', async () => {
      delete process.env.ALERTMANAGER_BASE_URL

      const status = await checkReadiness()

      expect(status.healthy).toBe(false)
      expect(status.configValid).toBe(false)
      expect(status.message).toContain('ALERTMANAGER_BASE_URL')
    })

    it('returns unhealthy when ALERTMANAGER_BASE_URL is invalid', async () => {
      process.env.ALERTMANAGER_BASE_URL = 'not-a-url'

      const status = await checkReadiness()

      expect(status.healthy).toBe(false)
      expect(status.configValid).toBe(false)
      expect(status.message).toContain('ALERTMANAGER_BASE_URL')
    })

    it('returns unhealthy when Alertmanager is unreachable', async () => {
      process.env.ALERTMANAGER_BASE_URL = 'http://localhost:9999'
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'))

      const status = await checkReadiness()

      expect(status.healthy).toBe(false)
      expect(status.configValid).toBe(true)
      expect(status.alertmanagerReachable).toBe(false)
      expect(status.message).toContain('unreachable')
    })

    it('handles abort signal', async () => {
      process.env.ALERTMANAGER_BASE_URL = 'http://localhost:9999'
      const abortController = new AbortController()
      abortController.abort()

      vi.mocked(globalThis.fetch).mockImplementation(() => {
        return Promise.reject(new DOMException('Aborted', 'AbortError'))
      })

      const status = await checkReadiness(abortController.signal)

      expect(status.healthy).toBe(false)
      expect(status.alertmanagerReachable).toBe(false)
    })

    it('strips trailing slashes from base URL', async () => {
      process.env.ALERTMANAGER_BASE_URL = 'http://localhost:9093/'
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 }),
      )

      const status = await checkReadiness()

      expect(status.configValid).toBe(true)
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:9093/api/v2/status'),
        expect.any(Object),
      )
    })
  })
})

