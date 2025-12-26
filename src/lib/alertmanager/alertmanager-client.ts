import { createServerFn } from '@tanstack/react-start'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'

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

  const response = await fetch(alertsUrl, {
    headers: {
      accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    let bodyText = ''

    try {
      bodyText = await response.text()
    } catch {
      bodyText = ''
    }

    const trimmedBody = bodyText.trim()
    const suffix = trimmedBody ? `: ${trimmedBody.slice(0, 500)}` : ''

    throw new Error(
      `Alertmanager request failed (${response.status} ${response.statusText})${suffix}`,
    )
  }

  const data = (await response.json()) as Array<AlertmanagerAlert>

  if (!Array.isArray(data)) {
    throw new TypeError(
      'Alertmanager returned an invalid alerts payload (expected an array).',
    )
  }

  return data
})
