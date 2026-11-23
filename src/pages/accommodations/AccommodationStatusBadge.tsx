import { useTranslation } from 'react-i18next'
import type { AccommodationStatus } from '../../types/app'

const tones: Record<AccommodationStatus, string> = {
  ACTIVE: 'bg-teal-500 text-white ring-teal-500',
  FULL: 'bg-mint-500 text-white ring-mint-500',
  PENDING_REVIEW: 'bg-amber-400 text-ink-800 ring-amber-500',
  INACTIVE: 'bg-cream-100 text-ink-500 ring-line',
}

export function AccommodationStatusBadge({ status }: { status: AccommodationStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${tones[status]}`}
    >
      {t(`accommodationStatuses.${status}`)}
    </span>
  )
}
