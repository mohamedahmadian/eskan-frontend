import {
  AlignLeft,
  ArrowUpDown,
  BadgeCheck,
  Bath,
  BookOpen,
  CalendarDays,
  Car,
  Droplets,
  Flame,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Mars,
  Maximize2,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Share2,
  Shirt,
  Snowflake,
  Type,
  UserRound,
  UtensilsCrossed,
  Venus,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { Button } from '../../components/ui/Form'
import { FormEmptyHint, FormFactTile, FormMetaChip, FormSectionTitle } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { languageDir } from '../../i18n'
import { formatNumber } from '../../lib/datetime'
import { geoName, stageCoordinates, useGeoName } from '../../lib/geo'
import type { WalkingRouteStage } from '../../types/app'
import { StationNearbyPlaces } from './StationNearbyPlaces'

export type StationStayPreview = {
  stayDate: string
  mealType: 'LUNCH' | 'DINNER'
  present?: boolean
}

const stationInfoTabs = ['info', 'amenities', 'map'] as const
type StationInfoTab = (typeof stationInfoTabs)[number]

const stationInfoTabIcons: Record<StationInfoTab, LucideIcon> = {
  info: Milestone,
  amenities: Shirt,
  map: MapIcon,
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function stageKey(stage: WalkingRouteStage) {
  return stage.stationId || stage.id || `${stage.cityId}-${stage.stageNumber}`
}

export function stageTitle(stage: WalkingRouteStage, locale: string, fallback: string) {
  return stage.name?.trim() || geoName(stage.city, locale) || fallback
}

export function StationInfoCard({
  stage,
  locale,
  onClose,
  headerAction,
  stay,
  className,
}: {
  stage: WalkingRouteStage
  locale: string
  onClose?: () => void
  headerAction?: ReactNode
  stay?: StationStayPreview | null
  className?: string
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<StationInfoTab>('info')
  const name = useGeoName()
  const coords = stageCoordinates(stage)
  const n = (value: number) => formatNumber(value, locale)
  const km = (value: number | null | undefined) =>
    value == null ? '' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`
  const equipped = (value: boolean) =>
    value ? t('walkingStations.equipped') : t('walkingStations.notEquipped')
  const countValue = (value: number | null | undefined) =>
    value == null ? '—' : n(value)
  const title = stageTitle(stage, locale, `${t('walkingRoutes.stage')} ${n(stage.stageNumber)}`)
  const hasManagerContact = hasText(stage.managerName) || hasText(stage.managerPhone)
  const hasManager =
    hasManagerContact ||
    hasText(stage.managerTelegram) ||
    hasText(stage.managerWhatsapp) ||
    hasText(stage.managerEitaa)
  const hasStay = Boolean(stay)
  const hasActions = Boolean(headerAction || onClose)

  return (
    <article
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-teal-100 bg-white shadow-[0_18px_40px_rgba(20,40,40,0.16)]${className ? ` ${className}` : ''}`}
    >
      <header className="relative overflow-hidden bg-gradient-to-e from-mint-50 via-white to-teal-50 px-4 py-3.5 sm:px-5">
        <div
          className="pointer-events-none absolute -start-8 -top-10 size-28 rounded-full bg-teal-200/30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -end-6 -bottom-10 size-24 rounded-full bg-mint-100/70"
          aria-hidden
        />
        <div
          className={`relative grid gap-3 ${
            hasStay
              ? 'sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center'
              : 'sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start'
          }`}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <Milestone className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-teal-700">
                {t('walkingRoutes.stage')} {n(stage.stageNumber)}
              </p>
              <h3 className="text-sm font-semibold leading-6 text-ink-900 sm:truncate">{title}</h3>
              {hasManagerContact ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {hasText(stage.managerName) ? (
                    <FormMetaChip icon={UserRound} label={stage.managerName} />
                  ) : null}
                  {hasText(stage.managerPhone) ? (
                    <FormMetaChip icon={Phone} copyValue={stage.managerPhone} />
                  ) : null}
                </div>
              ) : null}
              <p className={`${hasManagerContact ? 'mt-1.5' : 'mt-0.5'} text-xs text-ink-500 sm:truncate`}>
                {name(stage.city.province)} · {name(stage.city)}
              </p>
            </div>
          </div>
          {hasStay && stay ? (
            <div className="flex flex-col items-center gap-2">
              <p className="inline-flex flex-wrap items-center justify-center gap-1.5 text-sm font-bold text-teal-800">
                <span className="flex size-6 items-center justify-center rounded-full bg-teal-500 text-white shadow-[0_6px_12px_rgba(46,189,182,0.32)]">
                  <BadgeCheck className="size-4" aria-hidden />
                </span>
                {t('reservations.routePlacementStatReserved')}
                {stay.present ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                    {t('walkingStations.present')}
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                    {t('walkingStations.absent')}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-base font-semibold text-ink-800 shadow-[0_6px_14px_rgba(20,40,40,0.06)] ring-1 ring-teal-100">
                  <CalendarDays className="size-5 text-teal-600" aria-hidden />
                  <DateText value={stay.stayDate} />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-base font-semibold text-ink-800 shadow-[0_6px_14px_rgba(20,40,40,0.06)] ring-1 ring-teal-100">
                  <UtensilsCrossed className="size-5 text-teal-600" aria-hidden />
                  {t(`reservations.stationMeals.${stay.mealType}`)}
                </span>
              </div>
            </div>
          ) : null}
          {hasActions ? (
            <div className={`flex shrink-0 items-center gap-2 ${hasStay ? 'sm:justify-self-end' : ''}`}>
              {headerAction ? <div className="min-w-0 flex-1 sm:flex-none">{headerAction}</div> : null}
              {onClose ? (
                <Button
                  type="button"
                  variant="ghost"
                  icon
                  aria-label={t('common.close')}
                  title={t('common.close')}
                  onClick={onClose}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : hasStay ? (
            <div aria-hidden className="hidden sm:block" />
          ) : null}
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-teal-100 bg-cream-50/80 px-4 py-2.5 sm:px-5">
        {stationInfoTabs.map((item) => {
          const Icon = stationInfoTabIcons[item]
          const active = tab === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                  : 'bg-white text-ink-700 hover:bg-cream-100'
              }`}
            >
              <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
              {t(item === 'info' ? 'walkingStations.tabs.infoBrief' : `walkingStations.tabs.${item}`)}
            </button>
          )
        })}
      </nav>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        {tab === 'info' ? (
        <section className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {hasText(stage.name) ? (
              <FormFactTile
                icon={Type}
                label={t('walkingRoutes.stationName')}
                value={stage.name}
                tone="teal"
              />
            ) : null}
            <FormFactTile
              icon={MapPin}
              label={t('walkingRoutes.city')}
              value={name(stage.city)}
              tone="mint"
            />
            <FormFactTile
              icon={MapPinned}
              label={t('geo.province')}
              value={name(stage.city.province)}
              tone="ink"
            />
            {stage.distanceToPreviousKm != null ? (
              <FormFactTile
                icon={ArrowUpDown}
                label={t('walkingRoutes.distanceToPreviousKm')}
                value={km(stage.distanceToPreviousKm)}
                tone="teal"
              />
            ) : null}
            {stage.distanceToNextKm != null ? (
              <FormFactTile
                icon={ArrowUpDown}
                label={t('walkingRoutes.distanceToNextKm')}
                value={km(stage.distanceToNextKm)}
                tone="mint"
              />
            ) : null}
            {stage.distanceToMashhadKm != null ? (
              <FormFactTile
                icon={Milestone}
                label={t('walkingRoutes.stageDistanceToMashhadKm')}
                value={km(stage.distanceToMashhadKm)}
                tone="ink"
              />
            ) : null}
            {hasText(stage.address) ? (
              <FormFactTile
                icon={MapPin}
                label={t('walkingStations.address')}
                value={<span className="whitespace-pre-wrap">{stage.address}</span>}
                tone="mint"
                className="sm:col-span-2"
              />
            ) : null}
            {hasText(stage.neshanAddress) ? (
              <FormFactTile
                icon={Navigation}
                label={t('walkingStations.neshanAddress')}
                value={stage.neshanAddress}
                tone="teal"
                className="sm:col-span-2"
              />
            ) : null}
            <FormFactTile
              icon={Mars}
              label={t('walkingStations.maleCount')}
              value={n(stage.maleCount ?? 0)}
              tone="mint"
            />
            <FormFactTile
              icon={Venus}
              label={t('walkingStations.femaleCount')}
              value={n(stage.femaleCount ?? 0)}
              tone="ink"
            />
            {hasText(stage.description) ? (
              <FormFactTile
                icon={AlignLeft}
                label={t('walkingRoutes.description')}
                value={<span className="whitespace-pre-wrap">{stage.description}</span>}
                tone="ink"
                className="sm:col-span-2"
              />
            ) : null}
          </div>
        </section>
        ) : null}

        {tab === 'amenities' ? (
        <section className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Shirt}
              label={t('walkingStations.hasLaundry')}
              value={equipped(stage.hasLaundry)}
              tone="teal"
            />
            <FormFactTile
              icon={Wifi}
              label={t('walkingStations.hasInternet')}
              value={equipped(stage.hasInternet)}
              tone="mint"
            />
            <FormFactTile
              icon={BookOpen}
              label={t('walkingStations.hasPrayerRoom')}
              value={equipped(stage.hasPrayerRoom)}
              tone="ink"
            />
            <FormFactTile
              icon={ArrowUpDown}
              label={t('walkingStations.hasElevator')}
              value={equipped(stage.hasElevator)}
              tone="teal"
            />
            <FormFactTile
              icon={Flame}
              label={t('walkingStations.heatingSystem')}
              value={stage.heatingSystem || '—'}
              empty={!stage.heatingSystem}
              tone="mint"
            />
            <FormFactTile
              icon={Snowflake}
              label={t('walkingStations.coolingSystem')}
              value={stage.coolingSystem || '—'}
              empty={!stage.coolingSystem}
              tone="ink"
            />
            <FormFactTile
              icon={Car}
              label={t('walkingStations.parkingCapacity')}
              value={countValue(stage.parkingCapacity)}
              empty={stage.parkingCapacity == null}
              tone="teal"
            />
            <FormFactTile
              icon={Bath}
              label={t('walkingStations.bathroomCount')}
              value={countValue(stage.bathroomCount)}
              empty={stage.bathroomCount == null}
              tone="mint"
            />
            <FormFactTile
              icon={Droplets}
              label={t('walkingStations.toiletCount')}
              value={countValue(stage.toiletCount)}
              empty={stage.toiletCount == null}
              tone="ink"
            />
            <FormFactTile
              icon={Maximize2}
              label={t('walkingStations.areaSqm')}
              value={countValue(stage.areaSqm)}
              empty={stage.areaSqm == null}
              tone="teal"
            />
          </div>
        </section>
        ) : null}

        {tab === 'info' && hasManager ? (
          <section className="space-y-2">
            <FormSectionTitle icon={UserRound} className="mb-0">
              {t('walkingRoutes.sectionManager')}
            </FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {hasText(stage.managerName) ? (
                <FormFactTile
                  icon={UserRound}
                  label={t('walkingRoutes.managerName')}
                  value={stage.managerName}
                  tone="teal"
                />
              ) : null}
              {hasText(stage.managerPhone) ? (
                <FormFactTile
                  icon={Phone}
                  label={t('walkingRoutes.managerPhone')}
                  copyValue={stage.managerPhone}
                  tone="mint"
                />
              ) : null}
              {hasText(stage.managerWhatsapp) ? (
                <FormFactTile
                  icon={Phone}
                  label={t('walkingRoutes.managerWhatsapp')}
                  copyValue={stage.managerWhatsapp}
                  tone="ink"
                />
              ) : null}
              {hasText(stage.managerTelegram) ? (
                <FormFactTile
                  icon={MessageCircle}
                  label={t('walkingRoutes.managerTelegram')}
                  value={<span dir="ltr">{stage.managerTelegram}</span>}
                  tone="teal"
                />
              ) : null}
              {hasText(stage.managerEitaa) ? (
                <FormFactTile
                  icon={Share2}
                  label={t('walkingRoutes.managerEitaa')}
                  value={<span dir="ltr">{stage.managerEitaa}</span>}
                  tone="mint"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {tab === 'info' ? (
        <StationNearbyPlaces
          cityId={stage.cityId}
          latitude={coords?.lat}
          longitude={coords?.lng}
          compact
        />
        ) : null}

        {tab === 'map' ? (
          coords ? (
            <div className="overflow-hidden rounded-2xl ring-1 ring-teal-100">
              <OsmMapPicker
                key={stage.stationId || stageKey(stage)}
                latitude={String(coords.lat)}
                longitude={String(coords.lng)}
                onChange={() => undefined}
                active
                variant="always"
                readOnly
                heightClass="h-72 sm:h-80"
              />
            </div>
          ) : (
            <FormEmptyHint>{t('walkingRoutes.stationsNoMap')}</FormEmptyHint>
          )
        ) : null}
      </div>
    </article>
  )
}

export function StationDetailsOverlay({
  stage,
  locale,
  onClose,
}: {
  stage: WalkingRouteStage
  locale: string
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-ink-900/25 p-3"
      onClick={onClose}
    >
      <div
        dir={languageDir(locale)}
        role="dialog"
        aria-modal="true"
        className="h-[80%] w-[80%]"
        onClick={(event) => event.stopPropagation()}
      >
        <StationInfoCard stage={stage} locale={locale} onClose={onClose} />
      </div>
    </div>
  )
}

export function StationDetailsModal({
  stage,
  locale,
  onClose,
  headerAction,
}: {
  stage: WalkingRouteStage
  locale: string
  onClose: () => void
  headerAction?: ReactNode
}) {
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/25 p-3"
      onClick={onClose}
    >
      <div
        dir={languageDir(locale)}
        role="dialog"
        aria-modal="true"
        className="h-[80%] w-[min(100%,42rem)] max-w-4xl sm:w-[80%]"
        onClick={(event) => event.stopPropagation()}
      >
        <StationInfoCard
          stage={stage}
          locale={locale}
          onClose={onClose}
          headerAction={headerAction}
        />
      </div>
    </div>,
    document.body,
  )
}
