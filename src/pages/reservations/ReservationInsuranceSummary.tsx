import {
  Banknote,
  CalendarDays,
  Clock3,
  Shield,
  ShieldCheck,
  Users,
  UserRound,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { cardClassName } from '../../components/ui/Form'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { Reservation } from '../../types/app'
import { insurancePaidMethodLabel, summarizeInsurance } from './reservation-steps'
import { ReservationMembersGrid } from './ReservationMembersGrid'
import { ReservationIdentityChips, ReservationSectionHeader } from './ReservationSectionHeader'

type Tone = 'teal' | 'mint' | 'ink' | 'amber' | 'red'

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
  amber: {
    wrap: 'border-amber-100 bg-gradient-to-b from-amber-50 to-white',
    icon: 'bg-amber-500 text-white shadow-[0_8px_16px_rgba(245,158,11,0.28)]',
  },
  red: {
    wrap: 'border-red-100 bg-gradient-to-b from-red-50 to-white',
    icon: 'bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.24)]',
  },
}

export function ReservationInsuranceSummary({
  reservation,
  hint,
  readonly,
  footer,
}: {
  reservation: Reservation
  hint?: string
  readonly?: boolean
  footer?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const members = reservation.members
  const summary = summarizeInsurance(members ?? [])
  const individual = reservation.type === 'INDIVIDUAL'
  const hasPayment = summary.approved > 0 || Boolean(summary.lastPaidAt)
  const amountText = `${formatGroupedNumber(summary.paidAmount, locale)} ${t('receptionSettings.toman')}`

  if (members === undefined) {
    return (
      <section className={`${cardClassName} p-6`}>
        <p className="text-sm text-ink-600">{t('reservations.membersHidden')}</p>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </section>
    )
  }

  const metrics: { key: string; label: string; value: number; icon: LucideIcon; tone: Tone }[] = [
    {
      key: 'total',
      label: t('reservations.insuranceTotal'),
      value: summary.total,
      icon: Users,
      tone: 'teal',
    },
    {
      key: 'approved',
      label: t('reservations.insuranceApprovedCount'),
      value: summary.approved,
      icon: ShieldCheck,
      tone: 'mint',
    },
    {
      key: 'pending',
      label: t('reservations.insurancePendingCount'),
      value: summary.pending,
      icon: Clock3,
      tone: 'amber',
    },
    {
      key: 'rejected',
      label: t('reservations.insuranceRejectedCount'),
      value: summary.rejected,
      icon: XCircle,
      tone: 'red',
    },
  ]

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <ReservationSectionHeader
        icon={Shield}
        title={t('reservations.steps.insurance')}
        hint={hint}
        readonly={readonly}
        badge={
          summary.completed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-2 py-0.5 text-[11px] font-medium text-white">
              <ShieldCheck className="size-3" aria-hidden />
              {t('reservations.insuranceCompleteBadge')}
            </span>
          ) : null
        }
        chips={<ReservationIdentityChips reservation={reservation} />}
      />

      <div className="space-y-5 p-5 sm:p-6">
        {individual ? null : (
          <section>
            <SectionTitle icon={Users}>{t('reservations.insuranceTotal')}</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {metrics.map((item) => (
                <MetricTile
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={n(item.value)}
                  unit={t('reservations.people')}
                  tone={item.tone}
                />
              ))}
            </div>
          </section>
        )}

        {hasPayment ? (
          <section>
            <SectionTitle icon={Banknote}>{t('reservations.insurancePaidAmount')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FactTile
                icon={Banknote}
                label={
                  individual
                    ? t('reservations.insurancePaidAmount')
                    : t('reservations.insurancePaidSoFar')
                }
                value={amountText}
                tone="teal"
              />
              <FactTile
                icon={CalendarDays}
                label={
                  individual
                    ? t('reservations.insurancePaidAt')
                    : summary.completed
                      ? t('reservations.insurancePaymentsCompletedAt')
                      : t('reservations.insuranceLastPaidAt')
                }
                value={
                  summary.lastPaidAt ? <DateText value={summary.lastPaidAt} withTime /> : '—'
                }
                empty={!summary.lastPaidAt}
                tone="mint"
              />
              {individual && members[0] ? (
                <>
                  <FactTile
                    icon={Wallet}
                    label={t('reservations.insurancePaidMethod')}
                    value={insurancePaidMethodLabel(members[0].insurancePaidMethod, t) ?? '—'}
                    empty={!members[0].insurancePaidMethod}
                    tone="teal"
                  />
                  <FactTile
                    icon={UserRound}
                    label={t('reservations.insurancePaidBy')}
                    value={members[0].insurancePaidBy?.fullName ?? '—'}
                    empty={!members[0].insurancePaidBy}
                    tone="ink"
                  />
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle icon={UserRound}>{t('reservations.insuranceMembers')}</SectionTitle>
          <ReservationMembersGrid
            members={members}
            inputId="insurance-members-search"
            showInsurance
          />
        </section>
      </div>

      {footer ? <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div> : null}
    </section>
  )
}

function SectionTitle({
  icon: Icon,
  children,
  className = 'mb-2.5',
}: {
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={`inline-flex items-center gap-2 text-xs font-semibold text-ink-600 ${className}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {children}
    </h3>
  )
}

function FactTile({
  icon: Icon,
  label,
  value,
  empty,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  empty?: boolean
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${colors.wrap}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-500">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold ${empty ? 'text-ink-400' : 'text-ink-900'}`}>
          {value}
        </p>
      </div>
    </article>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${colors.wrap}`}>
      <span className={`flex size-9 items-center justify-center rounded-xl ${colors.icon}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
      <p className="text-[10px] text-ink-400">{unit}</p>
    </article>
  )
}
