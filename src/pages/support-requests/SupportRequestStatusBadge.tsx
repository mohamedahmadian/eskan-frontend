import { useTranslation } from 'react-i18next'
import type { SupportRequestStatus } from '../../types/app'

const statusTones: Record<SupportRequestStatus, string> = {
  PENDING: 'bg-gold-50 text-gold-600',
  IN_PROGRESS: 'bg-teal-50 text-teal-700',
  FULFILLED: 'bg-mint-100 text-mint-700',
  REJECTED: 'bg-red-50 text-red-700',
}

export function SupportRequestStatusBadge({ status }: { status: SupportRequestStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTones[status]}`}
    >
      {t(`supportRequests.statuses.${status}`)}
    </span>
  )
}
