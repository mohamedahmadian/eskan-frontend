import { useTranslation } from 'react-i18next'
import type {
  ReservationMemberInsuranceStatus,
  ReservationStatus,
  ReservationType,
} from '../../types/app'

const statusTones: Record<ReservationStatus, { wrap: string; dot: string }> = {
  DRAFT: { wrap: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  PENDING_MANAGEMENT_REVIEW: { wrap: 'bg-gold-100 text-gold-600', dot: 'bg-gold-500' },
  COMPANIONS: { wrap: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  CARAVAN_CONTACTS: { wrap: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  INSURANCE: { wrap: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  COMPLETED: { wrap: 'bg-mint-100 text-mint-600', dot: 'bg-mint-500' },
  REJECTED: { wrap: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  CANCELLED: { wrap: 'bg-cream-100 text-ink-500', dot: 'bg-ink-400' },
}

const insuranceTones: Record<ReservationMemberInsuranceStatus, { wrap: string; dot: string }> = {
  PENDING: { wrap: 'bg-gold-100 text-gold-600', dot: 'bg-gold-500' },
  PAID: { wrap: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  APPROVED: { wrap: 'bg-mint-100 text-mint-600', dot: 'bg-mint-500' },
  REJECTED: { wrap: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
}

function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: { wrap: string; dot: string }
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.wrap}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
      {label}
    </span>
  )
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { t } = useTranslation()
  return <StatusChip label={t(`reservations.statuses.${status}`)} tone={statusTones[status]} />
}

const typeTones: Record<ReservationType, { wrap: string; dot: string }> = {
  INDIVIDUAL: { wrap: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  GROUP: { wrap: 'bg-mint-100 text-mint-600', dot: 'bg-mint-500' },
  CARAVAN: { wrap: 'bg-gold-100 text-gold-600', dot: 'bg-gold-500' },
}

export function ReservationTypeBadge({ type }: { type: ReservationType }) {
  const { t } = useTranslation()
  return <StatusChip label={t(`reservations.types.${type}`)} tone={typeTones[type]} />
}

export function InsuranceStatusBadge({
  status,
}: {
  status: ReservationMemberInsuranceStatus
}) {
  const { t } = useTranslation()
  const display = status === 'PAID' ? 'APPROVED' : status
  const labels: Record<ReservationMemberInsuranceStatus, string> = {
    PENDING: t('reservations.insurancePending'),
    PAID: t('reservations.insuranceApproved'),
    APPROVED: t('reservations.insuranceApproved'),
    REJECTED: t('reservations.insuranceRejected'),
  }
  return <StatusChip label={labels[display]} tone={insuranceTones[display]} />
}
