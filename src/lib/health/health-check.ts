import { createChildLogger } from '@/lib/logger'

export interface HealthStatus {
  healthy: boolean
  message: string
  alertmanagerReachable?: boolean
  alertmanagerLatencyMs?: number
  configValid?: boolean
}

const READINESS_TIMEOUT_MS = 2000
const log = createChildLogger('health')

function getAlertmanagerBaseUrl(): string | null {
  const baseUrl = process.env.ALERTMANAGER_BASE_URL

  if (!baseUrl) {
    return null
  }

  try {
    new URL(baseUrl)
    return baseUrl.replace(/\/+$/, '')
  } catch {
    return null
  }
}

async function checkAlertmanagerReachability(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<{ reachable: boolean; latencyMs?: number; error?: string }> {
  const startTime = Date.now()
  const statusUrl = `${baseUrl}/api/v2/status`

  log.debug({ url: statusUrl }, 'alertmanager check started')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), READINESS_TIMEOUT_MS)

    if (signal) {
      signal.addEventListener('abort', () => controller.abort())
    }

    const response = await fetch(statusUrl, {
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      return {
        reachable: false,
        latencyMs,
        error: `HTTP ${response.status} ${response.statusText}`,
      }
    }

    return { reachable: true, latencyMs }
  } catch (error) {
    const latencyMs = Date.now() - startTime

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          reachable: false,
          latencyMs,
          error: 'Timeout',
        }
      }

      return {
        reachable: false,
        latencyMs,
        error: error.message,
      }
    }

    return {
      reachable: false,
      latencyMs,
      error: 'Unknown error',
    }
  }
}

export async function checkReadiness(
  signal?: AbortSignal,
): Promise<HealthStatus> {
  const baseUrl = getAlertmanagerBaseUrl()

  if (!baseUrl) {
    log.debug({ configValid: false }, 'config validation failed')

    return {
      healthy: false,
      message: 'Missing or invalid ALERTMANAGER_BASE_URL',
      configValid: false,
    }
  }

  log.debug({ configValid: true }, 'config validation passed')

  const configStatus: HealthStatus = {
    healthy: true,
    message: 'Ready',
    configValid: true,
  }

  const alertmanagerCheck = await checkAlertmanagerReachability(baseUrl, signal)

  if (!alertmanagerCheck.reachable) {
    const status: HealthStatus = {
      ...configStatus,
      healthy: false,
      message: `Alertmanager unreachable: ${alertmanagerCheck.error || 'Unknown error'}`,
      alertmanagerReachable: false,
      alertmanagerLatencyMs: alertmanagerCheck.latencyMs,
    }

    log.warn(
      {
        healthy: status.healthy,
        reason: alertmanagerCheck.error || 'Unknown error',
        latencyMs: alertmanagerCheck.latencyMs,
      },
      'readiness check failed',
    )

    return status
  }

  const status: HealthStatus = {
    ...configStatus,
    healthy: true,
    message: 'Ready',
    alertmanagerReachable: true,
    alertmanagerLatencyMs: alertmanagerCheck.latencyMs,
  }

  log.info(
    {
      healthy: status.healthy,
      latencyMs: alertmanagerCheck.latencyMs,
    },
    'readiness check passed',
  )

  return status
}
