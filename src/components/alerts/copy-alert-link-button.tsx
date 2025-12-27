import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCallback, useEffect, useState } from 'react'

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
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const origin = globalThis.location?.origin
    if (!origin) {
      setUrl(null)
      return
    }

    setUrl(getAlertInternalUrl(fingerprint, origin))
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
      <TooltipTrigger
        render={
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
        }
      />
      <TooltipContent>Copy link</TooltipContent>
    </Tooltip>
  )
}
