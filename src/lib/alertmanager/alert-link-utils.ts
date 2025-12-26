import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'

export type AlertExternalLink = {
  label: string
  href: string
}

export function getAlertInternalPath(fingerprint: string) {
  return `/a/${encodeURIComponent(fingerprint)}`
}

export function getAlertInternalUrl(fingerprint: string, origin: string) {
  return new URL(getAlertInternalPath(fingerprint), origin).toString()
}

export function extractAlertExternalLinks(
  alert: AlertmanagerAlert,
): Array<AlertExternalLink> {
  const candidates: Array<[string, string | undefined]> = [
    ['Generator', alert.generatorURL],
    ['Runbook', alert.annotations.runbook_url],
    ['Dashboard', alert.annotations.dashboard],
    ['Panel', alert.annotations.panel],
    ['Link', alert.annotations.link],
  ]

  const links: Array<AlertExternalLink> = []
  const seen = new Set<string>()

  for (const [label, href] of candidates) {
    const sanitized = sanitizeExternalHttpUrl(href)
    if (!sanitized) {
      continue
    }

    if (seen.has(sanitized)) {
      continue
    }

    seen.add(sanitized)
    links.push({ label, href: sanitized })
  }

  return links
}

function sanitizeExternalHttpUrl(value: string | undefined) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
  } catch {
    return null
  }

  return trimmed
}
