import { Banknote, Building2, Coins, Hash, UserRound } from 'lucide-react'
import { type ReactNode, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { VoucherFact, VoucherTicket } from '../../components/voucher/VoucherTicket'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { IceVoucher } from '../../types/app'

export const IceVoucherCard = forwardRef<HTMLDivElement, { voucher: IceVoucher; qrUrl: string | null }>(
  function IceVoucherCard({ voucher, qrUrl }, ref) {
    const { t, i18n } = useTranslation()
    const locale = i18n.language.split('-')[0] ?? 'fa'

    return (
      <VoucherTicket
        ref={ref}
        title={t('iceVouchers.cardTitle')}
        code={voucher.code}
        codeLabel={t('iceVouchers.code')}
        issuedAt={voucher.requestedAt}
        issuedWithTime={false}
        qrUrl={qrUrl}
      >
        <VoucherFact icon={Building2} label={t('iceVouchers.accommodation')} value={voucher.accommodation.name} />
        <VoucherFact icon={UserRound} label={t('iceVouchers.manager')} value={voucher.accommodationManager.fullName} />
        <VoucherFact
          icon={Hash}
          label={t('iceVouchers.moldCount')}
          value={formatNumber(voucher.moldCount, locale)}
          accent
        />
        <VoucherFact
          icon={Coins}
          label={t('iceVouchers.costPerMold')}
          value={`${formatGroupedNumber(voucher.costPerMold, locale)} ${t('logisticsSettings.toman')}`}
        />
        <VoucherFact
          icon={Banknote}
          label={t('iceVouchers.totalCost')}
          value={`${formatGroupedNumber(voucher.totalCost, locale)} ${t('logisticsSettings.toman')}`}
        />
        {voucher.paidAt ? (
          <VoucherFact icon={Coins} label={t('iceVouchers.paidAt')} value={<DateText value={voucher.paidAt} withTime />} />
        ) : null}
        {voucher.description ? (
          <IceNote label={t('iceVouchers.description')} value={voucher.description} />
        ) : null}
      </VoucherTicket>
    )
  },
)

function IceNote({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-cream-50 px-3.5 py-3">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-900">{value}</p>
    </div>
  )
}
