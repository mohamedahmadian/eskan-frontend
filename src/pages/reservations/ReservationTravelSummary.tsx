import {
  Building2,
  Bus,
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  Footprints,
  MapPin,
  Mars,
  Route,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { cardClassName } from '../../components/ui/Form'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Reservation } from '../../types/app'
import { ReservationCountMetrics } from './ReservationCountMetrics'
import { ReservationIdentityChips, ReservationSectionHeader } from './ReservationSectionHeader'

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

export function ReservationTravelSummary({
  reservation,
  variant,
  hint,
  readonly,
  footer,
}: {
  reservation: Reservation
  variant: 'travel' | 'review'
  hint?: string
  readonly?: boolean
  footer?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const empty = t('reservations.notEntered')
  const individual = reservation.type === 'INDIVIDUAL'
  const individualMale = individual && reservation.maleCount >= 1
  const individualFemale = individual && reservation.femaleCount >= 1
  const nights = stayNightCount(reservation.stayStartDate, reservation.stayEndDate)
  const HeaderIcon = variant === 'review' ? ClipboardCheck : MapPin
  const origin = reservation.originCity ? nameOf(reservation.originCity) : ''
  const route = reservation.walkingRoute?.name ?? ''

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <ReservationSectionHeader
        icon={HeaderIcon}
        title={t(`reservations.steps.${variant}`)}
        hint={hint}
        readonly={readonly}
        badge={
          variant === 'review' && reservation.managementReviewedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-2 py-0.5 text-[11px] font-medium text-white">
              <CalendarCheck className="size-3" aria-hidden />
              {t('reservations.reviewApprovedBadge')}
            </span>
          ) : null
        }
        chips={<ReservationIdentityChips reservation={reservation} />}
      />

      <div className="space-y-5 p-5 sm:p-6">
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
            <ReservationCountMetrics
              reservation={reservation}
              dual={variant === 'review'}
            />
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
          <div className="relative">
            <div
              className="pointer-events-none absolute top-7 start-10 end-10 hidden h-0.5 bg-gradient-to-l from-teal-200 via-mint-100 to-teal-100 sm:block"
              aria-hidden
            />
            <div
              className={`grid gap-2 sm:gap-3 ${
                reservation.walkingStartDate ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
              }`}
            >
              {reservation.walkingStartDate ? (
                <FactTile
                  icon={Footprints}
                  label={t('reservations.walkingStartDateShort')}
                  value={<DateText value={reservation.walkingStartDate} />}
                  tone="mint"
                />
              ) : null}
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
                value={
                  reservation.stayEndDate ? <DateText value={reservation.stayEndDate} /> : empty
                }
                empty={!reservation.stayEndDate}
                tone="ink"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <FactTile
              icon={Building2}
              label={t('reservations.requestsAccommodation')}
              value={reservation.requestsAccommodation ? t('common.yes') : t('common.no')}
              tone="teal"
            />
            <FactTile
              icon={Bus}
              label={t('reservations.requestsBus')}
              value={reservation.requestsBus ? t('common.yes') : t('common.no')}
              tone="mint"
            />
          </div>
        </section>

        {origin || route || reservation.caravan || reservation.group ? (
          <section>
            <SectionTitle icon={MapPin}>{t('reservations.createSteps.optional')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {origin ? (
                <FactTile
                  icon={MapPin}
                  label={t('reservations.originCity')}
                  value={origin}
                  tone="teal"
                />
              ) : null}
              {route ? (
                <FactTile
                  icon={Route}
                  label={t('reservations.walkingRoute')}
                  value={route}
                  tone="mint"
                />
              ) : null}
              {reservation.caravan ? (
                <FactTile
                  icon={Building2}
                  label={t('reservations.caravan')}
                  value={reservation.caravan.name}
                  tone="ink"
                />
              ) : null}
              {reservation.group ? (
                <FactTile
                  icon={Users}
                  label={t('reservations.groupName')}
                  value={reservation.group.name}
                  tone="ink"
                />
              ) : null}
            </div>
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
    <article className={`relative z-10 flex items-center gap-3 rounded-2xl border px-3 py-3 ${colors.wrap}`}>
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
