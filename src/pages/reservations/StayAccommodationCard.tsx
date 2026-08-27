import {
  Building2,
  Check,
  Hourglass,
  MapPinned,
  Mars,
  Navigation,
  Phone,
  Route,
  Share2,
  Smartphone,
  UserRoundCog,
  Venus,
  X,
} from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { Button, cardClassName } from '../../components/ui/Form'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import {
  FormCardHeader,
  FormCardHeaderDecor,
  FormFactTile,
} from '../../components/ui/FormLayout'
import { formatNumber } from '../../lib/datetime'
import type {
  ReservationAllocationSummary,
  ReservationStayAccommodation,
  UserGender,
} from '../../types/app'

type StayTone = 'teal' | 'mint'

const genderTone: Record<UserGender, StayTone> = {
  MALE: 'teal',
  FEMALE: 'mint',
}

function stayManager(
  accommodation: ReservationStayAccommodation | undefined,
  year: number,
) {
  const managers = accommodation?.managers ?? []
  if (!managers.length) return null
  const ranked = [...managers].sort((a, b) => {
    if (a.year === year && b.year !== year) return -1
    if (b.year === year && a.year !== year) return 1
    return Number(b.isPrimary) - Number(a.isPrimary)
  })
  const user = ranked[0]?.user
  const name = user?.fullName?.trim() || null
  const phone = user?.phone?.trim() || null
  if (!name && !phone) return null
  return { name, phone }
}

function asHref(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

export function StayTextOrLink({ value }: { value: string | null | undefined }) {
  const text = value?.trim() || ''
  if (!text) return null
  const href = asHref(text)
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        dir="ltr"
        className="break-all text-teal-800 underline-offset-4 hover:underline"
      >
        {text}
      </a>
    )
  }
  return <span className="break-words">{text}</span>
}

export function StayAccommodationCard({
  title,
  gender,
  needed,
  allocation,
  year,
  locale,
  formatCount,
  stackedIndex,
  stackedTotal,
  headerAction,
  chips,
  note,
  highlighted,
}: {
  title: string
  gender: UserGender
  needed: number
  allocation: ReservationAllocationSummary | null
  year: number
  locale: string
  formatCount: (value: number) => string
  stackedIndex?: number
  stackedTotal?: number
  headerAction?: ReactNode
  chips?: ReactNode
  note?: string | null
  highlighted?: boolean
}) {
  const { t } = useTranslation()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const tone = genderTone[gender]
  const assigned = Boolean(allocation)
  const place = allocation?.accommodation
  const GenderIcon = gender === 'MALE' ? Mars : Venus
  const header = assigned && place?.name ? place.name : title
  const statusText = assigned
    ? t('placements.statuses.PLACED')
    : t('reservations.placementUnassigned')
  const people =
    allocation != null
      ? t('accommodations.peopleCount', { count: formatCount(allocation.headcount) })
      : needed > 0
        ? t('accommodations.peopleCount', { count: formatCount(needed) })
        : null
  const manager = stayManager(place, year)
  const canOpenDetails = Boolean(assigned && place)

  return (
    <article
      className={`${cardClassName} overflow-hidden ${
        highlighted
          ? 'ring-2 ring-teal-200'
          : tone === 'teal'
            ? 'ring-1 ring-teal-100/80'
            : 'ring-1 ring-mint-100/80'
      }`}
    >
      <header
        className={`relative overflow-hidden px-5 py-4 sm:px-5 ${
          tone === 'teal'
            ? 'bg-gradient-to-e from-teal-50 via-white to-mint-50/40'
            : 'bg-gradient-to-e from-mint-50 via-white to-teal-50/40'
        }`}
      >
        <FormCardHeaderDecor />
        <div className="relative flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            {canOpenDetails ? (
              <button
                type="button"
                className="flex w-full cursor-pointer items-start gap-3 rounded-2xl text-start outline-none ring-teal-400 hover:bg-white/50 focus-visible:ring-2"
                onClick={() => setDetailsOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={detailsOpen}
                aria-label={t('accommodations.details')}
              >
                <StayHeaderIdentity
                  GenderIcon={GenderIcon}
                  tone={tone}
                  header={header}
                  assigned={assigned}
                  statusText={statusText}
                  subtitle={
                    <>
                      {title}
                      {stackedIndex && stackedTotal
                        ? ` · ${formatCount(stackedIndex)} / ${formatCount(stackedTotal)}`
                        : null}
                      {people ? ` · ${people}` : null}
                    </>
                  }
                />
              </button>
            ) : (
              <div className="flex items-start gap-3">
                <StayHeaderIdentity
                  GenderIcon={GenderIcon}
                  tone={tone}
                  header={header}
                  assigned={assigned}
                  statusText={statusText}
                  subtitle={
                    <>
                      {assigned ? title : t('reservations.placementStatusLabel')}
                      {stackedIndex && stackedTotal
                        ? ` · ${formatCount(stackedIndex)} / ${formatCount(stackedTotal)}`
                        : null}
                      {people ? ` · ${people}` : null}
                    </>
                  }
                />
              </div>
            )}
            {chips ? <div className="mt-2.5 flex flex-wrap gap-1.5">{chips}</div> : null}
            {note ? <p className="mt-2 text-[11px] leading-5 text-ink-500">{note}</p> : null}
          </div>
          {headerAction ? (
            <div className="relative z-10 flex shrink-0 flex-wrap gap-2">{headerAction}</div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:gap-3 sm:p-5">
        <FormFactTile
          icon={Building2}
          label={t('accommodations.name')}
          value={place?.name || ''}
          empty={!place?.name}
          tone={tone}
          className="sm:col-span-2"
        />
      </div>

      {detailsOpen && place ? (
        <StayAccommodationDetailsModal
          place={place}
          name={place.name}
          tone={tone}
          manager={manager}
          locale={locale}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}
    </article>
  )
}

function StayHeaderIdentity({
  GenderIcon,
  tone,
  header,
  assigned,
  statusText,
  subtitle,
}: {
  GenderIcon: typeof Mars
  tone: StayTone
  header: string
  assigned: boolean
  statusText: string
  subtitle: ReactNode
}) {
  return (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-white ${
          tone === 'teal'
            ? 'bg-teal-500 shadow-[0_10px_22px_rgba(46,189,182,0.32)]'
            : 'bg-mint-500 shadow-[0_10px_22px_rgba(95,191,122,0.28)]'
        }`}
      >
        <GenderIcon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-900">{header}</h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              assigned ? 'bg-teal-500 text-white' : 'bg-white text-ink-600 ring-1 ring-line'
            }`}
          >
            {assigned ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <Hourglass className="size-3" aria-hidden />
            )}
            {statusText}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-ink-500">{subtitle}</p>
      </div>
    </>
  )
}

function StayAccommodationDetailsModal({
  place,
  name,
  tone,
  manager,
  locale,
  onClose,
}: {
  place: ReservationStayAccommodation
  name: string
  tone: StayTone
  manager: { name: string | null; phone: string | null } | null
  locale: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const lat = place.latitude
  const lng = place.longitude
  const hasPoint =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
  const distance =
    place.distanceToShrineKm != null
      ? `${formatNumber(place.distanceToShrineKm, locale)} ${t('accommodations.km')}`
      : ''

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      data-nested-dialog
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[min(90vh,44rem)] w-full max-w-2xl flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="sr-only" id={titleId}>
          {name}
        </div>
        <FormCardHeader
          icon={Building2}
          title={name}
          subtitle={t('accommodations.details')}
          action={
            <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.cancel')}>
              <X className="size-4" aria-hidden />
            </Button>
          }
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-2 p-4 sm:grid-cols-2 sm:gap-3 sm:p-5">
            <FormFactTile
              icon={Navigation}
              label={t('accommodations.neshanAddress')}
              value={<StayTextOrLink value={place.neshanAddress} />}
              empty={!place.neshanAddress?.trim()}
              tone={tone}
              className="sm:col-span-2"
            />
            <FormFactTile
              icon={Route}
              label={t('reservations.placementDistanceToShrine')}
              value={distance}
              empty={!distance}
              tone={tone === 'teal' ? 'mint' : 'teal'}
            />
            <FormFactTile
              icon={UserRoundCog}
              label={t('reservations.placementManager')}
              value={manager?.name || ''}
              empty={!manager?.name}
              tone={tone}
            />
            <FormFactTile
              icon={Smartphone}
              label={t('reservations.placementManagerPhone')}
              value={
                manager?.phone ? <CopyableDigits value={manager.phone} empty="" /> : ''
              }
              empty={!manager?.phone}
              tone={tone === 'teal' ? 'mint' : 'teal'}
            />
            <FormFactTile
              icon={Phone}
              label={t('reservations.placementPhone')}
              value={place.phone ? <CopyableDigits value={place.phone} empty="" /> : ''}
              empty={!place.phone}
              tone={tone}
            />
            <SocialTile
              eitaa={place.eitaa}
              bale={place.bale}
              otherSocial={place.otherSocial}
              tone={tone}
            />
          </div>
          <StayMap
            latitude={hasPoint ? String(lat) : ''}
            longitude={hasPoint ? String(lng) : ''}
            pendingLabel={t('reservations.placementMapPending')}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}

function StayMap({
  latitude,
  longitude,
  pendingLabel,
}: {
  latitude: string
  longitude: string
  pendingLabel: string
}) {
  if (!latitude || !longitude) {
    return (
      <div className="border-t border-line bg-gradient-to-b from-cream-50 to-teal-50/30 px-4 py-5 sm:px-5">
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-200/80 bg-white/70 text-center sm:h-56">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <MapPinned className="size-6" aria-hidden />
          </span>
          <p className="max-w-xs px-3 text-xs leading-6 text-ink-500">{pendingLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-line bg-cream-50/60 p-4 sm:p-5">
      <OsmMapPicker
        latitude={latitude}
        longitude={longitude}
        onChange={() => undefined}
        variant="always"
        readOnly
        heightClass="h-48 sm:h-56"
      />
    </div>
  )
}

function SocialTile({
  eitaa,
  bale,
  otherSocial,
  tone,
}: {
  eitaa?: string | null
  bale?: string | null
  otherSocial?: string | null
  tone: StayTone
}) {
  const { t } = useTranslation()
  const rows = [
    { label: t('accommodations.eitaa'), value: eitaa },
    { label: t('accommodations.bale'), value: bale },
    { label: t('accommodations.otherSocial'), value: otherSocial },
  ]

  return (
    <article
      className={`rounded-2xl border px-3 py-3 sm:col-span-2 ${
        tone === 'teal'
          ? 'border-teal-100 bg-gradient-to-b from-teal-50 to-white'
          : 'border-mint-100 bg-gradient-to-b from-mint-50 to-white'
      }`}
    >
      <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
        <Share2 className="size-3.5 text-teal-600" aria-hidden />
        {t('reservations.placementSocial')}
      </p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-[11px] font-medium text-ink-500">{row.label}:</span>
            <span
              className={`min-w-0 flex-1 font-semibold ${
                row.value?.trim() ? 'text-ink-900' : 'text-ink-400'
              }`}
            >
              <StayTextOrLink value={row.value} />
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}
