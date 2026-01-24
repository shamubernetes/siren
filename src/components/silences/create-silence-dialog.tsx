import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { AlertmanagerAlert } from '@/lib/alertmanager/alertmanager-types'
import { createAlertmanagerSilence } from '@/lib/alertmanager/alertmanager-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  alertLabelsToMatchers,
  calculateEndTime,
  DURATION_OPTIONS,
  type DurationKey,
  getDurationMs,
  getStoredCreatedBy,
  setStoredCreatedBy,
} from '@/components/silences/utils'

type CreateSilenceDialogProps = {
  alert: AlertmanagerAlert
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function getDefaultCustomEndTime(): string {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 16)
}

export function CreateSilenceDialog({
  alert,
  open,
  onOpenChange,
  onSuccess,
}: CreateSilenceDialogProps) {
  const [durationKey, setDurationKey] = useState<DurationKey>('2h')
  const [customEndTime, setCustomEndTime] = useState(getDefaultCustomEndTime)
  const [comment, setComment] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setCreatedBy(getStoredCreatedBy())
      setComment('')
      setDurationKey('2h')
      setCustomEndTime(getDefaultCustomEndTime())
    }
  }, [open])

  const matchers = alertLabelsToMatchers(alert.labels)

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()

      let endsAt: string
      if (durationKey === 'custom') {
        const customDate = new Date(customEndTime)
        if (customDate <= new Date()) {
          toast.error('End time must be in the future')
          return
        }
        endsAt = customDate.toISOString()
      } else {
        const durationMs = getDurationMs(durationKey)
        if (!durationMs) {
          toast.error('Invalid duration')
          return
        }
        endsAt = calculateEndTime(durationMs)
      }

      setIsSubmitting(true)

      try {
        const createdByValue = createdBy.trim() || 'Siren User'

        if (createdBy.trim()) {
          setStoredCreatedBy(createdBy.trim())
        }

        const result = await createAlertmanagerSilence({
          data: {
            matchers,
            startsAt: new Date().toISOString(),
            endsAt,
            createdBy: createdByValue,
            comment: comment.trim(),
          },
        })

        toast.success(`Silence created: ${result.silenceID}`)
        if (onSuccess) {
          onSuccess()
        } else {
          onOpenChange(false)
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create silence',
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      comment,
      createdBy,
      customEndTime,
      durationKey,
      matchers,
      onOpenChange,
      onSuccess,
    ],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Silence Alert</DialogTitle>
            <DialogDescription>
              Create a silence to suppress notifications for this alert.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <Field>
              <FieldLabel>Matchers</FieldLabel>
              <FieldDescription>
                The silence will match alerts with these labels.
              </FieldDescription>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {matchers.map((matcher) => (
                  <Badge
                    key={matcher.name}
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    {matcher.name}={matcher.value}
                  </Badge>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="duration">Duration</FieldLabel>
              <Select
                value={durationKey}
                onValueChange={(value) => setDurationKey(value as DurationKey)}
              >
                <SelectTrigger id="duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {durationKey === 'custom' && (
                <Input
                  type="datetime-local"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-2"
                />
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="comment">Comment (optional)</FieldLabel>
              <Textarea
                id="comment"
                placeholder="Reason for silencing this alert..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="createdBy">Created by (optional)</FieldLabel>
              <Input
                id="createdBy"
                placeholder="Your name or identifier"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter>
            <DialogClose disabled={isSubmitting}>Cancel</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Silence'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
