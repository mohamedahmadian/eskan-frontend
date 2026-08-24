import { Mars, Users, Venus, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../lib/datetime'
import type { Reservation } from '../../types/app'

type Tone = 'teal' | 'mint' | 'ink'

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
    icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
  },
  mint: {
    wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
    icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(95,191,122,0.24)]',
  },
  ink: {
    wrap: 'border-line bg-gradient-to-b from-cream-50 to-white',
    icon: 'bg-ink-700 text-white',
  },
}

export function ReservationCountMetrics({
  reservation,
  dual = false,
}: {
  reservation: Reservation
  dual?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const requestedMale = reservation.requestedMaleCount ?? reservation.maleCount
  const requestedFemale = reservation.requestedFemaleCount ?? reservation.femaleCount
  const requestedTotal = requestedMale + requestedFemale

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <MetricTile
        icon={Mars}
        label={t('reservations.male')}
        value={n(reservation.maleCount)}
        suggested={dual ? n(requestedMale) : undefined}
        unit={t('reservations.people')}
        tone="teal"
      />
      <MetricTile
        icon={Venus}
        label={t('reservations.female')}
        value={n(reservation.femaleCount)}
        suggested={dual ? n(requestedFemale) : undefined}
        unit={t('reservations.people')}
        tone="mint"
      />
      <MetricTile
        icon={Users}
        label={t('reservations.totalCount')}
        value={n(reservation.totalCount)}
        suggested={dual ? n(requestedTotal) : undefined}
        unit={t('reservations.people')}
        tone="ink"
      />
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  suggested,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  suggested?: string
  unit: string
  tone: Tone
}) {
  const { t } = useTranslation()
  const colors = toneClass[tone]
  const dual = suggested != null

  return (
    <article
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${colors.wrap}`}
      aria-label={
        dual
          ? `${label}: ${suggested} ${t('reservations.requestedCountShort')}، ${value} ${t('reservations.approvedCountShort')}`
          : undefined
      }
    >
      <span className={`flex size-9 items-center justify-center rounded-xl ${colors.icon}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      {dual ? (
        <div className="flex w-full items-center justify-center gap-3">
          <CountPair
            value={suggested}
            caption={t('reservations.requestedCountShort')}
            variant="requested"
          />
          <CountPair
            value={value}
            caption={t('reservations.approvedCountShort')}
            variant="approved"
          />
        </div>
      ) : (
        <>
          <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
          <p className="text-[10px] text-ink-400">{unit}</p>
        </>
      )}
    </article>
  )
}

function CountPair({
  value,
  caption,
  variant,
}: {
  value: string
  caption: string
  variant: 'requested' | 'approved'
}) {
  const requested = variant === 'requested'
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span className={`text-lg font-bold leading-none ${requested ? 'text-amber-700' : 'text-teal-700'}`}>
        {value}
      </span>
      <span className={`text-[10px] ${requested ? 'text-amber-700' : 'text-teal-700'}`}>{caption}</span>
    </div>
  )
}
