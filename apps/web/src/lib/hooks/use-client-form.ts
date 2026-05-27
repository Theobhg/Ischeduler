/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { type UseFormHandleSubmit, type UseFormProps, type UseFormReturn, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

type UseClientFormProps<Input extends z.ZodType<any, any>, Output> = Omit<UseFormProps<z.input<Input>>, 'resolver'> & {
  schema: Input
  handler: (values: z.output<Input>) => Output
  onSubmitStart?: (data: z.output<Input>) => void
  onSubmitError?: (error: any, data: z.output<Input>) => void
  onSubmitSuccess?: (result: Awaited<Output>) => void
  onSubmitStatusChange?: (isSubmitting: boolean) => void
  keepOnLoading?: boolean

  submitTrigger?: 'onChange' | 'onSubmit'
  submitDebounceTime?: number
}

type UseClientFormReturn<Input extends z.ZodType<any, any>, Output> = Omit<
  UseFormReturn<z.input<Input>, any, z.output<Input>>,
  'handleSubmit'
> & {
  isSubmitting: boolean
  canSubmit: boolean
  response: Output | null
  error: any
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  handleSubmitOrigin: UseFormHandleSubmit<z.output<Input>>
  triggerSubmit?: () => void
}

export const useClientForm = <Input extends z.ZodType<any, any>, Output>({
  schema,
  handler,
  onSubmitError,
  onSubmitSuccess,
  onSubmitStart,
  defaultValues,
  keepOnLoading = false,
  submitTrigger = 'onSubmit',
  submitDebounceTime = 500,
  ...formOptions
}: UseClientFormProps<Input, Output>): UseClientFormReturn<Input, Output> => {
  const form = useForm<z.input<Input>, any, z.output<Input>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues,
    ...(formOptions as any),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any>(null)
  const [response, setResponse] = useState<Output | null>(null)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const parseResultWithDefaultValue = (data: z.output<Input>) => {
    const result = {
      ...defaultValues,
      ...data,
    } as z.output<Input>

    return result
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true)

    try {
      const typedData = data as z.output<Input>
      const parsedData = parseResultWithDefaultValue(typedData)

      if (onSubmitStart) onSubmitStart(parsedData)

      const result = await handler(parsedData)

      setResponse(result)

      if (!keepOnLoading) setIsSubmitting(false)

      if (onSubmitSuccess) return onSubmitSuccess(result)
    } catch (error: any) {
      setError(error)

      setIsSubmitting(false)
      if (onSubmitError) return onSubmitError(error, data as z.output<Input>)
      else toast.error('An error occurred while processing your request.')

      console.error(error)
    }
  })

  const handleSubmitRef = useRef(handleSubmit)

  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to watch the form
  useEffect(() => {
    if (submitTrigger !== 'onChange') return

    const subscription = form.watch(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        handleSubmitRef.current()
      }, submitDebounceTime)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [submitTrigger, submitDebounceTime])

  const triggerSubmit = () => {
    handleSubmit()
  }

  const canSubmit = form.formState.isValid && !isSubmitting && form.formState.isDirty

  return {
    ...form,
    handleSubmit,
    triggerSubmit,
    handleSubmitOrigin: form.handleSubmit as UseFormHandleSubmit<z.output<Input>>,
    canSubmit,
    error,
    isSubmitting,
    response,
  }
}
