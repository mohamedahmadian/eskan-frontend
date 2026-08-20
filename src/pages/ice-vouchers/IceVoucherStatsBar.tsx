import { BadgeCheck, Banknote, Clock3, ScrollText, Wallet, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, cardClassName } from '../../components/ui/Form'
import { formatNumber } from '../../lib/datetime'
import type { IceVoucherStats } from '../../types/app'

export function IceVoucherStatsBar({
  stats,
  locale,
  onPayAll,
}: {
  stats?: IceVoucherStats
  locale: string
  onPayAll?: () => void
}) {
  const { t } = useTranslation()
  const cells: {
    icon: LucideIcon
    tone: string
    label: string
    value?: number
    action?: ReactNode
  }[] = [
    {
      icon: ScrollText,
      tone: 'bg-teal-50 text-teal-700',
      label: t('iceVouchers.statsTotal'),
      value: stats?.total,
    },
    {
      icon: BadgeCheck,
      tone: 'bg-teal-50 text-teal-700',
      label: t('iceVouchers.statsApproved'),
      value: stats?.approved,
    },
    {
      icon: Clock3,
      tone: 'bg-gold-50 text-gold-600',
      label: t('iceVouchers.statsUnapproved'),
      value: stats?.unapproved,
    },
    {
      icon: Wallet,
      tone: 'bg-teal-50 text-teal-600',
      label: t('iceVouchers.statsPaid'),
      value: stats?.paid,
    },
    {
      icon: Banknote,
      tone: 'bg-gold-50 text-gold-600',
      label: t('iceVouchers.statsUnpaid'),
      value: stats?.unpaid,
      action:
        onPayAll && (stats?.payableUnpaid?.length ?? 0) > 0 ? (
          <Button type="button" className="mt-2 w-full" onClick={onPayAll}>
            <Banknote className="size-4" aria-hidden />
            {t('myIceVouchers.payAll')}
          </Button>
        ) : null,
    },
  ]

  return (
    <section className={`${cardClassName} mb-4 p-4 sm:p-5`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cells.map((cell) => (
          <StatCell key={cell.label} {...cell} locale={locale} />
        ))}
      </div>
    </section>
  )
}

function StatCell({
  icon: Icon,
  tone,
  label,
  value,
  locale,
  action,
}: {
  icon: LucideIcon
  tone: string
  label: string
  value?: number
  locale: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">
            {value == null ? '—' : formatNumber(value, locale)}
          </p>
        </div>
      </div>
      {action}
    </div>
  )
}
