import type {
  AlertmanagerLabelSet,
  SilenceMatcher,
} from '@/lib/alertmanager/alertmanager-types'

export function alertLabelsToMatchers(
  labels: AlertmanagerLabelSet,
): Array<SilenceMatcher> {
  return Object.entries(labels)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => ({
      name,
      value: value!,
      isRegex: false,
      isEqual: true,
    }))
}

export function calculateEndTime(durationMs: number): string {
  return new Date(Date.now() + durationMs).toISOString()
}

export const DURATION_OPTIONS = [
  { key: '1h', label: '1 hour', ms: 60 * 60 * 1000 },
  { key: '2h', label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { key: '4h', label: '4 hours', ms: 4 * 60 * 60 * 1000 },
  { key: '8h', label: '8 hours', ms: 8 * 60 * 60 * 1000 },
  { key: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { key: 'custom', label: 'Custom', ms: null },
] as const

export type DurationKey = (typeof DURATION_OPTIONS)[number]['key']

export function getDurationMs(key: DurationKey): number | null {
  const option = DURATION_OPTIONS.find((opt) => opt.key === key)
  return option?.ms ?? null
}

export const CREATED_BY_STORAGE_KEY = 'siren-silence-created-by'

export function getStoredCreatedBy(): string {
  if (globalThis.localStorage === undefined) return ''
  return globalThis.localStorage.getItem(CREATED_BY_STORAGE_KEY) ?? ''
}

export function setStoredCreatedBy(value: string): void {
  if (globalThis.localStorage === undefined) return
  globalThis.localStorage.setItem(CREATED_BY_STORAGE_KEY, value)
}
