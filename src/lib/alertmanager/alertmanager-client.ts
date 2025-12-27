import { createServerFn } from '@tanstack/react-start'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('alertmanager')

function getAlertmanagerBaseUrl() {
  const baseUrl = process.env.ALERTMANAGER_BASE_URL

  if (!baseUrl) {
    throw new Error('Missing env var: ALERTMANAGER_BASE_URL')
  }

  try {
    new URL(baseUrl)
  } catch {
    throw new Error(
      'Invalid ALERTMANAGER_BASE_URL. Expected an absolute URL, e.g. http://alertmanager:9093',
    )
  }

  return baseUrl.replace(/\/+$/, '')
}

export const fetchAlertmanagerAlerts = createServerFn({
  method: 'GET',
}).handler(async ({ signal }) => {
  const baseUrl = getAlertmanagerBaseUrl()
  const alertsUrl = `${baseUrl}/api/v2/alerts`
  const startTime = Date.now()

  log.debug({ url: alertsUrl }, 'fetching alerts')

  try {
    const response = await fetch(alertsUrl, {
      headers: {
        accept: 'application/json',
      },
      signal,
    })

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      let bodyText = ''

      try {
        bodyText = await response.text()
      } catch {
        bodyText = ''
      }

      const trimmedBody = bodyText.trim()
      const suffix = trimmedBody ? `: ${trimmedBody.slice(0, 500)}` : ''

      const error = new Error(
        `Alertmanager request failed (${response.status} ${response.statusText})${suffix}`,
      )

      log.error(
        {
          error: error.message,
          statusCode: response.status,
          latencyMs,
        },
        'failed to fetch alerts',
      )

      throw error
    }

    const data = (await response.json()) as Array<AlertmanagerAlert>

    if (!Array.isArray(data)) {
      const error = new TypeError(
        'Alertmanager returned an invalid alerts payload (expected an array).',
      )

      log.error(
        {
          error: error.message,
          statusCode: response.status,
          latencyMs,
        },
        'failed to fetch alerts',
      )

      throw error
    }

    log.info(
      {
        count: data.length,
        latencyMs,
      },
      'fetched alerts',
    )

    return data
  } catch (error) {
    const latencyMs = Date.now() - startTime

    if (error instanceof Error && error.name !== 'TypeError') {
      log.error(
        {
          error: error.message,
          statusCode: null,
          latencyMs,
        },
        'failed to fetch alerts',
      )
    }

    throw error
  }
})
