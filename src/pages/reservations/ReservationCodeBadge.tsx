import { Hash } from 'lucide-react'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { toLatinDigits } from '../../lib/datetime'

export function normalizeReservationCode(input: string) {
  return toLatinDigits(input).trim().replace(/\s+/g, '')
}

export function isReservationCodeQuery(input: string) {
  return /^\d{4}-\d+$/.test(normalizeReservationCode(input))
}

export function ReservationCodeBadge({
  code,
  size = 'md',
  highlighted = false,
  className = '',
}: {
  code?: string | null
  size?: 'sm' | 'md' | 'lg'
  highlighted?: boolean
  className?: string
}) {
  if (!code) return null
  const sizes = {
    sm: 'gap-1 rounded-xl px-2 py-0.5 text-xs',
    md: 'gap-1.5 rounded-xl px-2.5 py-1 text-sm',
    lg: 'gap-2 rounded-2xl px-3 py-1.5 text-base sm:text-lg',
  }
  const icons = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-5',
  }
  return (
    <span
      className={`inline-flex max-w-full items-center font-bold tabular-nums shadow-[0_4px_10px_rgba(20,40,40,0.05)] ${
        highlighted
          ? 'bg-teal-500 text-white ring-2 ring-teal-600'
          : 'bg-teal-50 text-teal-900 ring-2 ring-teal-500'
      } ${sizes[size]} ${className}`}
    >
      <Hash
        className={`${icons[size]} shrink-0 ${highlighted ? 'text-white' : 'text-teal-600'}`}
        aria-hidden
      />
      <CopyableDigits
        value={code}
        className={`font-bold ${highlighted ? 'text-white hover:text-cream-50' : ''}`}
      />
    </span>
  )
}
