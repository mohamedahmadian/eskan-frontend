import {
  Building2,
  CalendarCheck,
  CalendarX,
  Check,
  Footprints,
  MapPin,
  Mars,
  Route,
  ScrollText,
  ShieldCheck,
  UserRoundCog,
  Users,
  UserRound,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { cardClassName } from '../../components/ui/Form'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Reservation } from '../../types/app'
import { contactRoles } from './reservation-steps'
import { InsuranceStatusBadge, ReservationStatusBadge } from './ReservationStatusBadge'

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

function stayNightCount(start: string | null, end: string | null) {
  if (!start || !end) return 0
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const nights = Math.round((toUtc(end) - toUtc(start)) / 86_400_000)
  return nights > 0 ? nights : 0
}

export function ReservationCompleteSummary({
  reservation,
  variant = 'complete',
  footer,
}: {
  reservation: Reservation
  variant?: 'complete' | 'cancelled'
  footer?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const empty = t('reservations.notEntered')
  const unspecified = t('reservations.optionalUnspecified')
  const individual = reservation.type === 'INDIVIDUAL'
  const individualMale = individual && reservation.maleCount >= 1
  const individualFemale = individual && reservation.femaleCount >= 1
  const nights = stayNightCount(reservation.stayStartDate, reservation.stayEndDate)
  const origin = reservation.originCity ? nameOf(reservation.originCity) : unspecified
  const route = reservation.walkingRoute?.name ?? unspecified
  const members = reservation.members
  const contacts = reservation.caravanContacts
  const cancelled = variant === 'cancelled'

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <header className="relative overflow-hidden bg-gradient-to-l from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
        <div
          className="pointer-events-none absolute -start-8 -top-10 size-32 rounded-full bg-teal-200/30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -end-6 -bottom-12 size-28 rounded-full bg-mint-100/70"
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
            {cancelled ? <ScrollText className="size-6" aria-hidden /> : <Check className="size-6" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink-900">
                {cancelled ? t('reservations.cancelledFileInfo') : t('reservations.completedTitle')}
              </h2>
              {cancelled ? null : <ReservationStatusBadge status={reservation.status} />}
            </div>
            {cancelled ? (
              <p className="mt-1 text-xs leading-6 text-ink-600">{t('reservations.cancelledFileHint')}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <MetaChip icon={ScrollText} label={`${t('reservations.year')} ${n(reservation.year)}`} />
              <MetaChip icon={Users} label={t(`reservations.types.${reservation.type}`)} />
              {reservation.completedAt ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-teal-100">
                  <CalendarCheck className="size-3 shrink-0 text-teal-600" aria-hidden />
                  <span>{t('reservations.completedAt')}</span>
                  <DateText value={reservation.completedAt} withTime />
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {cancelled ? null : (
          <p className="rounded-2xl border border-teal-100 bg-gradient-to-l from-white to-teal-50 px-4 py-3 text-sm leading-7 text-ink-700">
            {t('reservations.completedBody')}
          </p>
        )}
        <section>
          <SectionTitle icon={Users}>{t('reservations.createSteps.count')}</SectionTitle>
          {individual ? (
            <FactTile
              icon={individualMale ? Mars : Venus}
              label={t(`reservations.typeFull.${reservation.type}`)}
              value={
                individualMale
                  ? t('reservations.individualPersonMale')
                  : individualFemale
                    ? t('reservations.individualPersonFemale')
                    : empty
              }
              empty={!individualMale && !individualFemale}
              tone={individualMale ? 'teal' : 'mint'}
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <MetricTile
                icon={Mars}
                label={t('reservations.male')}
                value={n(reservation.maleCount)}
                unit={t('reservations.people')}
                tone="teal"
              />
              <MetricTile
                icon={Venus}
                label={t('reservations.female')}
                value={n(reservation.femaleCount)}
                unit={t('reservations.people')}
                tone="mint"
              />
              <MetricTile
                icon={Users}
                label={t('reservations.totalCount')}
                value={n(reservation.totalCount)}
                unit={t('reservations.people')}
                tone="ink"
              />
            </div>
          )}
        </section>

        <section>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={CalendarCheck} className="mb-0">
              {t('reservations.createSteps.dates')}
            </SectionTitle>
            {nights ? (
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
                {t('reservations.stayNights', { count: n(nights) })}
              </span>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            <FactTile
              icon={Footprints}
              label={t('reservations.walkingStartDateShort')}
              value={
                reservation.walkingStartDate ? (
                  <DateText value={reservation.walkingStartDate} />
                ) : (
                  empty
                )
              }
              empty={!reservation.walkingStartDate}
              tone="mint"
            />
            <FactTile
              icon={CalendarCheck}
              label={t('reservations.stayStartDateShort')}
              value={
                reservation.stayStartDate ? <DateText value={reservation.stayStartDate} /> : empty
              }
              empty={!reservation.stayStartDate}
              tone="teal"
            />
            <FactTile
              icon={CalendarX}
              label={t('reservations.stayEndDateShort')}
              value={reservation.stayEndDate ? <DateText value={reservation.stayEndDate} /> : empty}
              empty={!reservation.stayEndDate}
              tone="ink"
            />
          </div>
        </section>

        <section>
          <SectionTitle icon={MapPin}>{t('reservations.createSteps.optional')}</SectionTitle>
          <div
            className={`grid gap-2 sm:gap-3 ${reservation.type === 'CARAVAN' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
          >
            <FactTile
              icon={MapPin}
              label={t('reservations.originCity')}
              value={origin}
              empty={!reservation.originCity}
              tone="teal"
            />
            <FactTile
              icon={Route}
              label={t('reservations.walkingRoute')}
              value={route}
              empty={!reservation.walkingRoute}
              tone="mint"
            />
            {reservation.type === 'CARAVAN' ? (
              <FactTile
                icon={Building2}
                label={t('reservations.caravan')}
                value={reservation.caravan?.name ?? empty}
                empty={!reservation.caravan}
                tone="ink"
              />
            ) : null}
          </div>
        </section>

        {members?.length ? (
          <section>
            <SectionTitle icon={UserRound}>
              {cancelled ? t('reservations.steps.companions') : t('reservations.insuranceMembers')}
            </SectionTitle>
            <ul className="space-y-2">
              {members.map((item) => (
                <li key={item.id}>
                  <article className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
                      <ShieldCheck className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{item.user.fullName}</p>
                      {item.user.nationalId ? (
                        <p className="mt-1 text-xs font-medium text-ink-600">
                          {localizeDigits(item.user.nationalId, locale)}
                        </p>
                      ) : null}
                    </div>
                    <InsuranceStatusBadge status={item.insuranceStatus} />
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {contacts?.length ? (
          <section>
            <SectionTitle icon={UserRoundCog}>{t('reservations.steps.contacts')}</SectionTitle>
            <ul className="space-y-2">
              {contactRoles.map((role) => {
                const current = contacts.find((item) => item.role === role)
                if (!current) return null
                return (
                  <li key={role}>
                    <article className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
                        <UserRoundCog className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-ink-500">
                          {t(`caravans.contactRoles.${role}`)}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-900">
                          {current.user.fullName}
                        </p>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
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

function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-teal-100">
      <Icon className="size-3 text-teal-600" aria-hidden />
      {label}
    </span>
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
