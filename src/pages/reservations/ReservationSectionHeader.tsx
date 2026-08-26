import { Footprints, Lock, ScrollText, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityNameSubtitle } from '../../components/ui/Form'
import { FormCardHeaderDecor } from '../../components/ui/FormLayout'
import { formatNumber } from '../../lib/datetime'
import type { ReservationListItem } from '../../types/app'

export function ReservationSectionHeader({
  icon: Icon,
  title,
  hint,
  readonly,
  badge,
  chips,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  readonly?: boolean
  badge?: ReactNode
  chips?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <header className="relative overflow-hidden bg-gradient-to-l from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
      <FormCardHeaderDecor />
      <div className="relative flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {readonly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
                <Lock className="size-3" aria-hidden />
                {t('reservations.readonlyBadge')}
              </span>
            ) : null}
            {badge}
          </div>
          {hint ? <p className="mt-1 text-xs leading-6 text-ink-600">{hint}</p> : null}
          {chips ? <div className="mt-3 flex flex-wrap gap-1.5">{chips}</div> : null}
        </div>
      </div>
    </header>
  )
}

export function ReservationMetaChip({
  icon: Icon,
  label,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  tone?: 'default' | 'alert'
}) {
  const alert = tone === 'alert'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ${
        alert
          ? 'bg-red-50 text-red-800 ring-red-200'
          : 'bg-white text-ink-700 ring-teal-100'
      }`}
    >
      <Icon className={`size-3 ${alert ? 'text-red-500' : 'text-teal-600'}`} aria-hidden />
      {label}
    </span>
  )
}

export function reservationPartyName(
  reservation: Pick<ReservationListItem, 'type' | 'group' | 'caravan'>,
) {
  if (reservation.type === 'GROUP') return reservation.group?.name?.trim() || ''
  if (reservation.type === 'CARAVAN') return reservation.caravan?.name?.trim() || ''
  return ''
}

function reservationPartyKindLabel(
  type: ReservationListItem['type'],
  t: (key: string) => string,
) {
  if (type === 'CARAVAN') return t('reservations.caravan')
  return ''
}

export function ReservationTitleMeta({
  reservation,
  extra,
}: {
  reservation: Pick<ReservationListItem, 'type' | 'group' | 'caravan'>
  extra?: ReactNode
}) {
  const { t } = useTranslation()
  const partyName = reservationPartyName(reservation)
  const partyKind = reservationPartyKindLabel(reservation.type, t)
  const PartyIcon = reservation.type === 'CARAVAN' ? Footprints : Users
  return (
    <div className="flex flex-wrap items-center gap-2">
      {partyName ? (
        <span className="inline-flex max-w-full items-center gap-2 rounded-2xl border-2 border-teal-500 bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-900">
          <PartyIcon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {partyKind ? `${partyKind} ${partyName}` : partyName}
          </span>
        </span>
      ) : null}
      <EntityNameSubtitle
        name={t(`reservations.types.${reservation.type}`)}
        icon={ScrollText}
      />
      {extra}
    </div>
  )
}

export function ReservationIdentityChips({
  reservation,
  extra,
}: {
  reservation: Pick<ReservationListItem, 'year' | 'type' | 'group' | 'caravan'>
  extra?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const partyName = reservationPartyName(reservation)
  const partyKind = reservationPartyKindLabel(reservation.type, t)
  const PartyIcon = reservation.type === 'CARAVAN' ? Footprints : Users
  return (
    <>
      {partyName ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink-900 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-2 ring-teal-500">
          <PartyIcon className="size-3 text-teal-600" aria-hidden />
          {partyKind ? `${partyKind} ${partyName}` : partyName}
        </span>
      ) : null}
      <ReservationMetaChip
        icon={ScrollText}
        label={`${t('reservations.year')} ${formatNumber(reservation.year, locale)}`}
      />
      <ReservationMetaChip icon={Users} label={t(`reservations.types.${reservation.type}`)} />
      {extra}
    </>
  )
}
