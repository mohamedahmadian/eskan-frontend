import { Hash, IdCard, MapPin, Package, Store, UserRound } from 'lucide-react'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { VoucherFact, VoucherFooter, VoucherTicket } from '../../components/voucher/VoucherTicket'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type ItemQuotaVoucher } from '../../types/app'

export const VoucherCard = forwardRef<HTMLDivElement, { voucher: ItemQuotaVoucher; qrUrl: string | null }>(
  function VoucherCard({ voucher, qrUrl }, ref) {
    const { t, i18n } = useTranslation()
    const locale = i18n.language.split('-')[0] ?? 'fa'
    const manager = voucher.accommodationManager
    const title =
      manager.gender === 'MALE'
        ? t('itemQuotaVouchers.mister')
        : manager.gender === 'FEMALE'
          ? t('itemQuotaVouchers.miss')
          : ''
    const recipient = [title, manager.fullName].filter(Boolean).join(' ')

    return (
      <VoucherTicket
        ref={ref}
        title={t('itemQuotaVouchers.cardTitle')}
        code={voucher.code}
        codeLabel={t('itemQuotaVouchers.code')}
        issuedAt={voucher.issuedAt}
        qrUrl={qrUrl}
        footer={
          <VoucherFooter
            icon={MapPin}
            label={t('itemQuotaVouchers.pickupLocation')}
            value={voucher.pickupLocation || '—'}
          />
        }
      >
        <VoucherFact icon={UserRound} label={t('itemQuotaVouchers.recipient')} value={recipient} />
        {manager.nationalId ? (
          <VoucherFact
            icon={IdCard}
            label={t('users.nationalId')}
            value={<CopyableDigits value={manager.nationalId} />}
          />
        ) : null}
        <VoucherFact icon={Package} label={t('itemQuotaVouchers.item')} value={voucher.quota.name} />
        <VoucherFact
          icon={Hash}
          label={t('itemQuotaVouchers.quantity')}
          value={`${formatNumber(voucher.quantity, locale)} ${formatItemUnit(voucher.quota.unit, t)}`}
          accent
        />
        <VoucherFact icon={Store} label={t('itemQuotaVouchers.supplier')} value={voucher.supplierName} />
      </VoucherTicket>
    )
  },
)
