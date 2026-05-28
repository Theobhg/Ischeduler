import { useCompletion } from '@ai-sdk/react'
import { Loader2Icon, WandSparklesIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateMessageInput } from '@ischeduler/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface GenerateMessageButtonProps {
  form: UseFormReturn<CreateMessageInput>
}

export function GenerateMessageButton({ form }: GenerateMessageButtonProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [brief, setBrief] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep a stable ref to form so effects don't re-run when the parent re-renders
  // and produces a new form object reference (which useClientForm does on every render).
  const formRef = useRef(form)
  useEffect(() => {
    formRef.current = form
  })

  const { completion, complete, isLoading, error, setCompletion } = useCompletion({
    api: `${import.meta.env.VITE_API_URL}/messages/generate`,
    streamProtocol: 'text',
  })

  // Stream tokens into the body field while generating.
  // Uses formRef (not form) so this effect only re-runs when completion changes.
  useEffect(() => {
    if (completion) {
      formRef.current.setValue('body', completion)
    }
  }, [completion])

  // Once streaming finishes, reset completion so stale text can't overwrite
  // any edits the user makes afterward.
  const wasLoadingRef = useRef(false)
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      setCompletion('')
    }
    wasLoadingRef.current = isLoading
  }, [isLoading, setCompletion])

  useEffect(() => {
    if (error) {
      toast.error('Failed to generate message. Please try again.')
    }
  }, [error])

  useEffect(() => {
    if (popoverOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [popoverOpen])

  function handleClick() {
    const draft = (form.getValues('body') ?? '').trim()

    if (draft) {
      complete('', { body: { draft, prompt: '' } })
      return
    }

    setPopoverOpen(true)
  }

  function handleGenerate() {
    setPopoverOpen(false)
    complete('', { body: { prompt: brief.trim(), draft: '' } })
    setBrief('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <TooltipProvider>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverAnchor asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isLoading}
                onClick={handleClick}
                aria-label="Generate message with AI"
              >
                {isLoading ? (
                  <Loader2Icon className="animate-spin text-primary" />
                ) : (
                  <WandSparklesIcon className="text-primary" />
                )}
              </Button>
            </PopoverAnchor>
          </TooltipTrigger>
          <TooltipContent side="top">
            {(form.getValues('body') ?? '').trim()
              ? 'Rewrite with AI'
              : 'Generate message with AI'}
          </TooltipContent>
        </Tooltip>

        <PopoverContent align="end" className="w-80">
          <p className="text-sm font-medium">What's the message about?</p>
          <p className="text-xs text-muted-foreground -mt-2">
            Add a brief topic or leave empty to generate from scratch.
          </p>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="e.g. 20% off this weekend"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button type="button" size="sm" onClick={handleGenerate}>
              Generate
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
