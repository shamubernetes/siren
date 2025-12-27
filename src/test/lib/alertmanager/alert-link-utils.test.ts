import { describe, expect, it } from 'vitest'
import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import {
  extractAlertExternalLinks,
  getAlertInternalPath,
  getAlertInternalUrl,
} from '@/lib/alertmanager/alert-link-utils'

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

describe('getAlertInternalPath', () => {
  it('returns path with encoded fingerprint', () => {
    expect(getAlertInternalPath('abc123')).toBe('/a/abc123')
    expect(getAlertInternalPath('test-fingerprint')).toBe('/a/test-fingerprint')
  })

  it('encodes special characters', () => {
    expect(getAlertInternalPath('test/fingerprint')).toBe(
      '/a/test%2Ffingerprint',
    )
    expect(getAlertInternalPath('test fingerprint')).toBe(
      '/a/test%20fingerprint',
    )
  })
})

describe('getAlertInternalUrl', () => {
  it('constructs absolute URL from fingerprint and origin', () => {
    const url = getAlertInternalUrl('abc123', 'https://example.com')
    expect(url).toBe('https://example.com/a/abc123')
  })

  it('handles origin with trailing slash', () => {
    const url = getAlertInternalUrl('abc123', 'https://example.com/')
    expect(url).toBe('https://example.com/a/abc123')
  })

  it('encodes fingerprint in URL', () => {
    const url = getAlertInternalUrl('test/fingerprint', 'https://example.com')
    expect(url).toBe('https://example.com/a/test%2Ffingerprint')
  })
})

describe('extractAlertExternalLinks', () => {
  it('extracts generatorURL', () => {
    const alert = createMockAlert({
      generatorURL: 'https://example.com/generator',
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Generator', href: 'https://example.com/generator' },
    ])
  })

  it('extracts runbook_url annotation', () => {
    const alert = createMockAlert({
      annotations: { runbook_url: 'https://example.com/runbook' },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Runbook', href: 'https://example.com/runbook' },
    ])
  })

  it('extracts dashboard annotation', () => {
    const alert = createMockAlert({
      annotations: { dashboard: 'https://example.com/dashboard' },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Dashboard', href: 'https://example.com/dashboard' },
    ])
  })

  it('extracts panel annotation', () => {
    const alert = createMockAlert({
      annotations: { panel: 'https://example.com/panel' },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Panel', href: 'https://example.com/panel' },
    ])
  })

  it('extracts link annotation', () => {
    const alert = createMockAlert({
      annotations: { link: 'https://example.com/link' },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([{ label: 'Link', href: 'https://example.com/link' }])
  })

  it('extracts multiple links in order', () => {
    const alert = createMockAlert({
      generatorURL: 'https://example.com/generator',
      annotations: {
        runbook_url: 'https://example.com/runbook',
        dashboard: 'https://example.com/dashboard',
      },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Generator', href: 'https://example.com/generator' },
      { label: 'Runbook', href: 'https://example.com/runbook' },
      { label: 'Dashboard', href: 'https://example.com/dashboard' },
    ])
  })

  it('accepts http URLs', () => {
    const alert = createMockAlert({
      generatorURL: 'http://example.com/generator',
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Generator', href: 'http://example.com/generator' },
    ])
  })

  it('rejects non-http/https URLs', () => {
    const alert = createMockAlert({
      generatorURL: 'ftp://example.com/file',
      annotations: {
        runbook_url: 'javascript:alert(1)',
        dashboard: 'file:///etc/passwd',
      },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([])
  })

  it('rejects invalid URLs', () => {
    const alert = createMockAlert({
      generatorURL: 'not-a-url',
      annotations: {
        runbook_url: 'also-not-a-url',
      },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([])
  })

  it('rejects empty strings', () => {
    const alert = createMockAlert({
      generatorURL: '',
      annotations: {
        runbook_url: '   ',
      },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([])
  })

  it('deduplicates identical URLs', () => {
    const alert = createMockAlert({
      generatorURL: 'https://example.com/same',
      annotations: {
        runbook_url: 'https://example.com/same',
        dashboard: 'https://example.com/different',
      },
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Generator', href: 'https://example.com/same' },
      { label: 'Dashboard', href: 'https://example.com/different' },
    ])
  })

  it('trims whitespace from URLs', () => {
    const alert = createMockAlert({
      generatorURL: '  https://example.com/generator  ',
    })
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([
      { label: 'Generator', href: 'https://example.com/generator' },
    ])
  })

  it('returns empty array when no valid links', () => {
    const alert = createMockAlert({})
    const links = extractAlertExternalLinks(alert)
    expect(links).toEqual([])
  })
})

