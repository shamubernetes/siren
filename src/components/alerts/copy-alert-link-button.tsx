import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCallback, useMemo } from 'react'

import { getAlertInternalUrl } from '@/lib/alertmanager/alert-link-utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type CopyAlertLinkButtonProps = {
  fingerprint: string
}

export function CopyAlertLinkButton({ fingerprint }: CopyAlertLinkButtonProps) {
  const url = useMemo(() => {
    if (typeof globalThis === 'undefined') {
      return null
    }

    return getAlertInternalUrl(fingerprint, globalThis.location.origin)
  }, [fingerprint])

  const handleCopy = useCallback(async () => {
    if (!url) {
      toast.error('Copy failed (not available during SSR)')
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }, [url])

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          aria-label="Copy alert link"
          disabled={!url}
        >
          <CopyIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy link</TooltipContent>
    </Tooltip>
  )
}
