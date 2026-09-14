'use client'

import { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode
  className?: string
}

/** Accessible field wrapper: label, hint, and field-linked error message. */
export function Field({ label, hint, error, required, children, className }: FieldShellProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errId} className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  required?: boolean
  placeholder?: string
  type?: string
  className?: string
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  placeholder,
  type = 'text',
  className,
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          className={cn(invalid && 'border-destructive focus-visible:ring-destructive/40')}
        />
      )}
    </Field>
  )
}

interface TextAreaFieldProps extends Omit<TextFieldProps, 'type'> {
  rows?: number
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  error,
  required,
  placeholder,
  rows = 4,
  className,
}: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          className={cn(invalid && 'border-destructive focus-visible:ring-destructive/40')}
        />
      )}
    </Field>
  )
}
