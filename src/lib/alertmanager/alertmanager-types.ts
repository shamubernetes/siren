export interface AlertmanagerReceiver {
  name: string
}

export type AlertmanagerLabelSet = Record<string, string | undefined>
export type AlertmanagerAnnotationSet = Record<string, string | undefined>

export interface AlertmanagerAlertStatus {
  state: string
  inhibitedBy?: Array<string>
  silencedBy?: Array<string>
}

export interface AlertmanagerAlert {
  annotations: AlertmanagerAnnotationSet
  endsAt: string
  fingerprint: string
  generatorURL?: string
  labels: AlertmanagerLabelSet
  receivers?: Array<AlertmanagerReceiver>
  startsAt: string
  status: AlertmanagerAlertStatus
  updatedAt?: string
}

export interface SilenceMatcher {
  name: string
  value: string
  isRegex: boolean
  isEqual: boolean
}

export interface CreateSilencePayload {
  matchers: Array<SilenceMatcher>
  startsAt: string
  endsAt: string
  createdBy: string
  comment: string
}

export interface SilenceResponse {
  silenceID: string
}
