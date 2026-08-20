import { useTranslation } from 'react-i18next'
import type { IceVoucherPaymentStatus, IceVoucherStatus } from '../../types/app'

const statusTones: Record<IceVoucherStatus, string> = {
  PENDING: 'bg-gold-50 text-gold-600',
  APPROVED: 'bg-teal-50 text-teal-700',
  REJECTED: 'bg-red-50 text-red-700',
}

const paymentTones: Record<IceVoucherPaymentStatus, string> = {
  UNPAID: 'bg-gold-50 text-gold-600',
  PAID: 'bg-teal-50 text-teal-700',
}

export function IceVoucherStatusBadge({ status }: { status: IceVoucherStatus }) {
  const { t } = useTranslation()
  const labels: Record<IceVoucherStatus, string> = {
    PENDING: t('iceVouchers.statusPending'),
    APPROVED: t('iceVouchers.statusApproved'),
    REJECTED: t('iceVouchers.statusRejected'),
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTones[status]}`}>
      {labels[status]}
    </span>
  )
}

export function IceVoucherPaymentBadge({ status }: { status: IceVoucherPaymentStatus }) {
  const { t } = useTranslation()
  const labels: Record<IceVoucherPaymentStatus, string> = {
    UNPAID: t('iceVouchers.unpaid'),
    PAID: t('iceVouchers.paid'),
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentTones[status]}`}>
      {labels[status]}
    </span>
  )
}

