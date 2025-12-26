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
