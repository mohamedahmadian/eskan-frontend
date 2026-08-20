import { Check, type LucideIcon, Pencil, Trash2, X } from 'lucide-react'
import type { ButtonHTMLAttributes, KeyboardEvent, FormHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-60 shadow-sm',
  gold: 'bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-60',
  ghost:
    'bg-white text-ink-700 hover:bg-cream-100 border border-line',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60',
}

export const cardClassName =
  'rounded-[22px] border border-white bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]'

export const formShellClassName = 'mx-auto w-full max-w-2xl'
export const userFormShellClassName = 'mx-auto w-full max-w-3xl'
export const listShellClassName = 'mx-auto w-full max-w-6xl'

export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  icon?: boolean
  children: ReactNode
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition ${
        icon ? 'size-9 p-0' : 'px-4 py-2.5'
      } ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function FormField({
  icon: Icon,
  label,
  htmlFor,
  error,
  children,
}: {
  icon: LucideIcon
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium text-ink-900"
      >
        <Icon className="size-4 text-teal-600" aria-hidden />
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  )
}

export const fieldClassName =
  'w-full rounded-2xl border border-line bg-cream-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400'

export function ToggleField({
  id,
  checked,
  onChange,
  onLabel,
  offLabel,
  disabled,
}: {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  onLabel: string
  offLabel: string
  disabled?: boolean
}) {
  const segmentClass = (active: boolean) =>
    `rounded-xl px-3 py-1.5 text-sm font-medium transition ${
      active ? 'bg-teal-500 text-white shadow-sm' : 'text-ink-600 hover:bg-white'
    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`

  return (
    <div
      id={id}
      data-toggle
      role="group"
      className="inline-flex rounded-2xl border border-line bg-cream-50 p-1"
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        className={segmentClass(checked)}
        onClick={() => onChange(true)}
      >
        {onLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={!checked}
        className={segmentClass(!checked)}
        onClick={() => onChange(false)}
      >
        {offLabel}
      </button>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function submitIfValid(form: HTMLFormElement) {
  if (form.checkValidity()) {
    form.requestSubmit()
  } else {
    form.reportValidity()
  }
}

export function handleFormEnter(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
  const target = event.target as HTMLElement | null
  if (!target) return
  if (target.closest('textarea')) return
  if (target.closest('[data-enter-ignore]')) return
  if (target instanceof HTMLSelectElement) return

  const button = target instanceof HTMLButtonElement ? target : target.closest('button')
  if (button instanceof HTMLButtonElement) {
    if (button.type === 'submit') return
    if (button.dataset.formCancel != null || button.closest('[data-form-cancel]')) return
  }

  event.preventDefault()
  submitIfValid(event.currentTarget)
}

export function AppForm({
  onKeyDown,
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        handleFormEnter(event)
      }}
    >
      {children}
    </form>
  )
}

export function FormActions({
  submitLabel,
  cancelLabel,
  submitting,
  onCancel,
}: {
  submitLabel: string
  cancelLabel?: string
  submitting?: boolean
  onCancel?: () => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" disabled={submitting}>
        <Check className="size-4" aria-hidden />
        {submitLabel}
      </Button>
      {onCancel && cancelLabel ? (
        <Button type="button" variant="ghost" data-form-cancel="" onClick={onCancel}>
          <X className="size-4" aria-hidden />
          {cancelLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function DetailActions({
  editTo,
  editLabel,
  deleteLabel,
  onDelete,
  extra,
  className = 'mt-6',
}: {
  editTo: string
  editLabel: string
  deleteLabel?: string
  onDelete?: () => void
  extra?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${extra ? 'justify-between' : ''} ${className}`}
    >
      <div className="flex flex-wrap gap-3">
        <Link to={editTo}>
          <Button type="button">
            <Pencil className="size-4" aria-hidden />
            {editLabel}
          </Button>
        </Link>
        {onDelete && deleteLabel ? (
          <Button type="button" variant="danger" onClick={onDelete}>
            <Trash2 className="size-4" aria-hidden />
            {deleteLabel}
          </Button>
        ) : null}
      </div>
      {extra ? <div className="flex flex-wrap gap-3">{extra}</div> : null}
    </div>
  )
}

export { LoadingState } from './LoadingState'
