import {
  Accessibility,
  Building2,
  Bus,
  CalendarCheck,
  CalendarX,
  Check,
  CreditCard,
  Footprints,
  HeartHandshake,
  MapPin,
  Mars,
  Route,
  ScrollText,
  Shield,
  Smartphone,
  Timer,
  UserRoundCog,
  Users,
  UserRound,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { cardClassName } from '../../components/ui/Form'
import { FormCardHeaderDecor } from '../../components/ui/FormLayout'
import { elapsedDurationParts, formatGroupedNumber, formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Reservation } from '../../types/app'
import { contactRoles, stepLabelKey, workingHeadcount } from './reservation-steps'
import { ReservationMembersGrid } from './ReservationMembersGrid'
import { ReservationStatusBadge } from './ReservationStatusBadge'
import { ReservationCountMetrics } from './ReservationCountMetrics'
import { ReservationIdentityChips } from './ReservationSectionHeader'
import { bankLabel, simOperatorLabel } from './ReservationIssuedServicesPanel'

type Tone = 'teal' | 'mint' | 'ink'

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
    icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
  },
  mint: {
    wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
    icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190),0.24)]',
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

function completionDurationLabel(
  createdAt: string,
  completedAt: string,
  locale: string,
  t: (key: string, options?: { count?: string }) => string,
) {
  const endMs = Date.parse(completedAt)
  if (!Number.isFinite(endMs)) return null
  const parts = elapsedDurationParts(createdAt, endMs)
  if (!parts) return null
  const n = (value: number) => formatNumber(value, locale)
  const chunks: string[] = []
  if (parts.days > 0) {
    chunks.push(t('reservations.elapsedDay', { count: n(parts.days) }))
  }
  if (parts.hours > 0) {
    chunks.push(t('reservations.elapsedHour', { count: n(parts.hours) }))
  }
  if (parts.minutes > 0) {
    chunks.push(t('reservations.elapsedMinute', { count: n(parts.minutes) }))
  }
  if (chunks.length === 0) {
    chunks.push(t('reservations.elapsedSecond', { count: n(parts.seconds) }))
  }
  return chunks.join(t('reservations.elapsedJoin'))
}

export function ReservationCompleteSummary({
  reservation,
  variant = 'complete',
  audience = 'owner',
  footer,
}: {
  reservation: Reservation
  variant?: 'complete' | 'cancelled'
  audience?: 'owner' | 'admin'
  footer?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const empty = t('reservations.notEntered')
  const individual = reservation.type === 'INDIVIDUAL'
  const headcount = workingHeadcount(reservation)
  const individualMale = individual && headcount.male >= 1
  const individualFemale = individual && headcount.female >= 1
  const nights = stayNightCount(reservation.stayStartDate, reservation.stayEndDate)
  const origin = reservation.originCity ? nameOf(reservation.originCity) : ''
  const route = reservation.walkingRoute?.name ?? ''
  const members = reservation.members
  const contacts = reservation.caravanContacts
  const cancelled = variant === 'cancelled'
  const durationLabel = reservation.completedAt
    ? completionDurationLabel(reservation.createdAt, reservation.completedAt, locale, t)
    : null

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <header className="relative overflow-hidden bg-gradient-to-e from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
        <FormCardHeaderDecor />
        <div className="relative flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
            {cancelled ? <ScrollText className="size-6" aria-hidden /> : <Check className="size-6" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink-900">
                {cancelled
                  ? t('reservations.cancelledFileInfo')
                  : t(
                      audience === 'admin'
                        ? 'reservations.completedTitleAdmin'
                        : 'reservations.completedTitle',
                    )}
              </h2>
              {cancelled ? null : <ReservationStatusBadge status={reservation.status} />}
            </div>
            {cancelled ? (
              <p className="mt-1 text-xs leading-6 text-ink-600">{t('reservations.cancelledFileHint')}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <ReservationIdentityChips reservation={reservation} />
              {reservation.completedAt ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-teal-100">
                  <CalendarCheck className="size-3 shrink-0 text-teal-600" aria-hidden />
                  <span>{t('reservations.completedAt')}</span>
                  <DateText value={reservation.completedAt} withTime />
                </span>
              ) : null}
              {durationLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-mint-100">
                  <Timer className="size-3 shrink-0 text-mint-600" aria-hidden />
                  <span>{t('reservations.completionDuration')}</span>
                  <span>{durationLabel}</span>
                </span>
              ) : null}
              {cancelled && reservation.cancelledAt ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-red-100">
                  <CalendarX className="size-3 shrink-0 text-red-600" aria-hidden />
                  <span>{t('reservations.cancelledAt')}</span>
                  <DateText value={reservation.cancelledAt} withTime />
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {cancelled || audience === 'admin' ? null : (
          <p className="rounded-2xl border border-teal-100 bg-gradient-to-e from-white to-teal-50 px-4 py-3 text-sm leading-7 text-ink-700">
            {t(
              !reservation.requestsAccommodation
                ? 'reservations.completedBodyNoStay'
                : reservation.placementStatus === 'PLACED'
                  ? 'reservations.completedBodyPlaced'
                  : reservation.placementStatus === 'PARTIAL'
                    ? 'reservations.completedBodyPartial'
                    : 'reservations.completedBodyPending',
            )}
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
            <ReservationCountMetrics reservation={reservation} dual />
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
              value={reservation.stayEndDate ? <DateText value={reservation.stayEndDate} /> : empty}
              empty={!reservation.stayEndDate}
              tone="ink"
            />
          </div>
        </section>

        <section>
          <SectionTitle icon={HeartHandshake}>{t('reservations.createSteps.services')}</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            <FactTile
              icon={Building2}
              label={t('reservations.requestsAccommodationShort')}
              value={reservation.requestsAccommodation ? t('common.yes') : t('common.no')}
              tone="teal"
            />
            <FactTile
              icon={Bus}
              label={t('reservations.requestsBusShort')}
              value={reservation.requestsBus ? t('common.yes') : t('common.no')}
              tone="mint"
            />
            <FactTile
              icon={Shield}
              label={t('reservations.requestsInsuranceOnlyShort')}
              value={
                !reservation.requestsAccommodation && !reservation.requestsBus
                  ? t('common.yes')
                  : t('common.no')
              }
              tone="ink"
            />
            <FactTile
              icon={Smartphone}
              label={t('reservations.requestsSimCardShort')}
              value={reservation.requestsSimCard ? t('common.yes') : t('common.no')}
              tone="teal"
            />
            <FactTile
              icon={CreditCard}
              label={t('reservations.requestsBankCardShort')}
              value={reservation.requestsBankCard ? t('common.yes') : t('common.no')}
              tone="mint"
            />
            <FactTile
              icon={Accessibility}
              label={t('reservations.specialServices')}
              value={reservation.specialServices?.trim() || empty}
              empty={!reservation.specialServices?.trim()}
              tone="ink"
            />
          </div>
          {reservation.simCardNumber ||
          reservation.simCardOperator ||
          reservation.simCardDeliveredAt ||
          reservation.simCardInitialCharge != null ? (
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <FactTile
                icon={Smartphone}
                label={t('reservations.simCardNumber')}
                value={
                  reservation.simCardNumber ? (
                    <CopyableDigits value={reservation.simCardNumber} empty={empty} />
                  ) : (
                    empty
                  )
                }
                empty={!reservation.simCardNumber}
                tone="teal"
              />
              <FactTile
                icon={Smartphone}
                label={t('reservations.simCardOperator')}
                value={simOperatorLabel(reservation.simCardOperator, t) || empty}
                empty={!reservation.simCardOperator}
                tone="mint"
              />
              <FactTile
                icon={CalendarCheck}
                label={t('reservations.simCardDeliveredAt')}
                value={
                  reservation.simCardDeliveredAt ? (
                    <DateText value={reservation.simCardDeliveredAt} />
                  ) : (
                    empty
                  )
                }
                empty={!reservation.simCardDeliveredAt}
                tone="ink"
              />
              <FactTile
                icon={Smartphone}
                label={t('reservations.simCardInitialCharge')}
                value={
                  reservation.simCardInitialCharge != null
                    ? `${formatGroupedNumber(reservation.simCardInitialCharge, locale)} ${t('receptionSettings.toman')}`
                    : empty
                }
                empty={reservation.simCardInitialCharge == null}
                tone="teal"
              />
            </div>
          ) : null}
          {reservation.bankCardNumber ||
          reservation.bankCardIban ||
          reservation.bankCardBank ||
          reservation.bankCardDeliveredAt ||
          reservation.bankCardInitialBalance != null ? (
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <FactTile
                icon={CreditCard}
                label={t('reservations.bankCardNumber')}
                value={
                  reservation.bankCardNumber ? (
                    <CopyableDigits value={reservation.bankCardNumber} empty={empty} />
                  ) : (
                    empty
                  )
                }
                empty={!reservation.bankCardNumber}
                tone="teal"
              />
              <FactTile
                icon={CreditCard}
                label={t('reservations.bankCardIban')}
                value={
                  reservation.bankCardIban ? (
                    <CopyableDigits value={reservation.bankCardIban} empty={empty} />
                  ) : (
                    empty
                  )
                }
                empty={!reservation.bankCardIban}
                tone="mint"
              />
              <FactTile
                icon={Building2}
                label={t('reservations.bankCardBank')}
                value={bankLabel(reservation.bankCardBank, t) || empty}
                empty={!reservation.bankCardBank}
                tone="ink"
              />
              <FactTile
                icon={CalendarCheck}
                label={t('reservations.bankCardDeliveredAt')}
                value={
                  reservation.bankCardDeliveredAt ? (
                    <DateText value={reservation.bankCardDeliveredAt} />
                  ) : (
                    empty
                  )
                }
                empty={!reservation.bankCardDeliveredAt}
                tone="teal"
              />
              <FactTile
                icon={CreditCard}
                label={t('reservations.bankCardInitialBalance')}
                value={
                  reservation.bankCardInitialBalance != null
                    ? `${formatGroupedNumber(reservation.bankCardInitialBalance, locale)} ${t('receptionSettings.toman')}`
                    : empty
                }
                empty={reservation.bankCardInitialBalance == null}
                tone="mint"
              />
            </div>
          ) : null}
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

        {members?.length ? (
          <section>
            <SectionTitle icon={UserRound}>
              {cancelled
                ? t(stepLabelKey('companions', reservation.type))
                : t('reservations.insuranceMembers')}
            </SectionTitle>
            <ReservationMembersGrid
              members={members}
              inputId="file-members-search"
              showInsurance
              isCaravan={reservation.type === 'CARAVAN'}
            />
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
