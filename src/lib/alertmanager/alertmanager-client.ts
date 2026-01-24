import { createServerFn } from '@tanstack/react-start'
import type {
  AlertmanagerAlert,
  CreateSilencePayload,
  SilenceResponse,
} from '@/lib/alertmanager/alertmanager-types'
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

export const createAlertmanagerSilence = createServerFn({
  method: 'POST',
})
  .inputValidator((data: CreateSilencePayload) => data)
  .handler(async ({ data }) => {
  const baseUrl = getAlertmanagerBaseUrl()
  const silenceUrl = `${baseUrl}/api/v2/silences`
  const startTime = Date.now()

  log.debug({ url: silenceUrl, matchers: data.matchers }, 'creating silence')

  try {
    const response = await fetch(silenceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
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
        `Failed to create silence (${response.status} ${response.statusText})${suffix}`,
      )

      log.error(
        {
          error: error.message,
          statusCode: response.status,
          latencyMs,
        },
        'failed to create silence',
      )

      throw error
    }

    const result = (await response.json()) as SilenceResponse

    log.info({ silenceID: result.silenceID, latencyMs }, 'created silence')

    return result
  } catch (error) {
    const latencyMs = Date.now() - startTime

    if (error instanceof Error && error.name !== 'TypeError') {
      log.error(
        {
          error: error.message,
          statusCode: null,
          latencyMs,
        },
        'failed to create silence',
      )
    }

    throw error
  }
})

export const deleteAlertmanagerSilence = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { silenceId: string }) => data)
  .handler(async ({ data }) => {
    const baseUrl = getAlertmanagerBaseUrl()
    const silenceUrl = `${baseUrl}/api/v2/silence/${encodeURIComponent(data.silenceId)}`
    const startTime = Date.now()

    log.debug({ url: silenceUrl, silenceId: data.silenceId }, 'deleting silence')

    try {
      const response = await fetch(silenceUrl, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
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
          `Failed to delete silence (${response.status} ${response.statusText})${suffix}`,
        )

        log.error(
          {
            error: error.message,
            statusCode: response.status,
            latencyMs,
          },
          'failed to delete silence',
        )

        throw error
      }

      log.info({ silenceId: data.silenceId, latencyMs }, 'deleted silence')

      return { success: true }
    } catch (error) {
      const latencyMs = Date.now() - startTime

      if (error instanceof Error && error.name !== 'TypeError') {
        log.error(
          {
            error: error.message,
            statusCode: null,
            latencyMs,
          },
          'failed to delete silence',
        )
      }

      throw error
    }
  })
