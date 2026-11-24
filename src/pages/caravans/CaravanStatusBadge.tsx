import { useTranslation } from 'react-i18next'
import {
  caravanStatuses,
  type CaravanStatus,
} from '../../types/app'

const tones: Record<CaravanStatus, string> = {
  ACTIVE: 'bg-teal-500 text-white ring-teal-500',
  PENDING_REVIEW: 'bg-amber-400 text-ink-800 ring-amber-500',
  INACTIVE: 'bg-cream-100 text-ink-500 ring-line',
}

export function resolveCaravanStatus(item: {
  status?: CaravanStatus
  isActive?: boolean
}): CaravanStatus {
  if (item.status) return item.status
  return item.isActive ? caravanStatuses.ACTIVE : caravanStatuses.INACTIVE
}

export function CaravanStatusBadge({
  status,
  isActive,
}: {
  status?: CaravanStatus
  isActive?: boolean
}) {
  const { t } = useTranslation()
  const resolved = resolveCaravanStatus({ status, isActive })
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${tones[resolved]}`}
    >
      {t(`caravanStatuses.${resolved}`)}
    </span>
  )
}
