import { BellIcon, BellOffIcon } from 'lucide-react'
import { useState } from 'react'

import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CreateSilenceDialog } from '@/components/silences/create-silence-dialog'
import {
  useSilenceState,
  type UseSilenceStateResult,
} from './use-silence-state'

type SilenceAlertButtonProps = {
  alert: AlertmanagerAlert
  onRefresh?: () => void
  /** Optional external silence state from useSilenceState hook */
  silenceState?: UseSilenceStateResult
}

export function SilenceAlertButton({
  alert,
  onRefresh,
  silenceState,
}: SilenceAlertButtonProps) {
  const [open, setOpen] = useState(false)

  // Use provided state or create internal state
  const internalState = useSilenceState(alert, onRefresh)
  const { isSilenced, canUnsilence, handleSilenceSuccess, handleUnsilence } =
    silenceState ?? internalState

  const onSilenceSuccess = () => {
    handleSilenceSuccess()
    setOpen(false)
  }

  if (isSilenced) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleUnsilence}
              disabled={!canUnsilence}
              aria-label="Remove silence"
            >
              <BellIcon className="size-4" />
            </Button>
          }
        />
        <TooltipContent>
          {canUnsilence ? 'Unsilence' : 'Syncing...'}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label="Silence alert"
            >
              <BellOffIcon className="size-4" />
            </Button>
          }
        />
        <TooltipContent>Silence</TooltipContent>
      </Tooltip>
      <CreateSilenceDialog
        alert={alert}
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSilenceSuccess}
      />
    </>
  )
}
