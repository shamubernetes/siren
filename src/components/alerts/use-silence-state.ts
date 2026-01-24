import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { deleteAlertmanagerSilence } from '@/lib/alertmanager/alertmanager-client'

export type UseSilenceStateResult = {
  /** Whether the alert is currently silenced (optimistic or server state) */
  isSilenced: boolean
  /** The raw optimistic state (null means use server state) */
  optimisticSilenced: boolean | null
  /** Whether an unsilence operation is in progress */
  isDeleting: boolean
  /** Whether unsilencing is possible (has silence IDs and not in pending state) */
  canUnsilence: boolean
  /** Call this when a silence is successfully created */
  handleSilenceSuccess: () => void
  /** Call this to remove all silences from the alert */
  handleUnsilence: () => Promise<void>
}

export function useSilenceState(
  alert: AlertmanagerAlert,
  onRefresh?: () => void,
): UseSilenceStateResult {
  const [isDeleting, setIsDeleting] = useState(false)
  const [optimisticSilenced, setOptimisticSilenced] = useState<boolean | null>(null)

  const silenceIds = alert.status.silencedBy ?? []
  const serverSilenced = silenceIds.length > 0
  const isSilenced = optimisticSilenced ?? serverSilenced

  // Can only unsilence if we have actual silence IDs from the server
  // When optimisticSilenced is true but no IDs yet, we're waiting for server sync
  const canUnsilence = serverSilenced && !isDeleting

  // Reset optimistic state when the server's silenced boolean actually changes
  useEffect(() => {
    setOptimisticSilenced(null)
  }, [serverSilenced])

  const handleSilenceSuccess = useCallback(() => {
    setOptimisticSilenced(true)
    onRefresh?.()
  }, [onRefresh])

  const handleUnsilence = useCallback(async () => {
    const currentSilenceIds = alert.status.silencedBy ?? []
    if (currentSilenceIds.length === 0) return

    setIsDeleting(true)

    try {
      await Promise.all(
        currentSilenceIds.map((silenceId) =>
          deleteAlertmanagerSilence({ data: { silenceId } }),
        ),
      )

      toast.success(
        currentSilenceIds.length === 1
          ? 'Silence removed'
          : `${currentSilenceIds.length} silences removed`,
      )

      setOptimisticSilenced(false)
      onRefresh?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove silence',
      )
    } finally {
      setIsDeleting(false)
    }
  }, [alert.status.silencedBy, onRefresh])

  return {
    isSilenced,
    optimisticSilenced,
    isDeleting,
    canUnsilence,
    handleSilenceSuccess,
    handleUnsilence,
  }
}
