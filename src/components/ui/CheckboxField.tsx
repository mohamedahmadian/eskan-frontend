import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

export function CheckboxField({
  id,
  checked,
  onChange,
  label,
  disabled,
}: {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
}) {
  return (
    <label
      className={`relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition ${
        checked
          ? 'border-teal-200 bg-teal-50 text-ink-900'
          : 'border-line bg-cream-50 text-ink-800 hover:border-teal-200 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-lg border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-teal-400 ${
          checked
            ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
            : 'border-line bg-white text-transparent'
        }`}
        aria-hidden
      >
        <Check className="size-3.5 stroke-[3]" />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </label>
  )
}
