import {
  AlignLeft,
  ArrowUpDown,
  MapPin,
  MapPinned,
  Mars,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Share2,
  Type,
  UserRound,
  Venus,
  X,
} from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Form'
import { FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { languageDir } from '../../i18n'
import { formatNumber } from '../../lib/datetime'
import { geoName, stageCoordinates, useGeoName } from '../../lib/geo'
import type { WalkingRouteStage } from '../../types/app'
import { StationNearbyPlaces } from './StationNearbyPlaces'

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
  className,
}: {
  stage: WalkingRouteStage
  locale: string
  onClose?: () => void
  headerAction?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const n = (value: number) => formatNumber(value, locale)
  const km = (value: number | null | undefined) =>
    value == null ? '' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`
  const title = stageTitle(stage, locale, `${t('walkingRoutes.stage')} ${n(stage.stageNumber)}`)
  const hasManager =
    hasText(stage.managerName) ||
    hasText(stage.managerPhone) ||
    hasText(stage.managerTelegram) ||
    hasText(stage.managerWhatsapp) ||
    hasText(stage.managerEitaa)

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
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <Milestone className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-teal-700">
                {t('walkingRoutes.stage')} {n(stage.stageNumber)}
              </p>
              <h3 className="text-sm font-semibold leading-6 text-ink-900 sm:truncate">{title}</h3>
              <p className="mt-0.5 text-xs text-ink-500 sm:truncate">
                {name(stage.city.province)} · {name(stage.city)}
              </p>
            </div>
          </div>
          {headerAction || onClose ? (
            <div className="flex shrink-0 items-center gap-2">
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
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <section className="space-y-2">
          <FormSectionTitle icon={MapPin} className="mb-0">
            {t('walkingRoutes.sectionStation')}
          </FormSectionTitle>
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

        {hasManager ? (
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

        <StationNearbyPlaces
          cityId={stage.cityId}
          latitude={stageCoordinates(stage)?.lat}
          longitude={stageCoordinates(stage)?.lng}
          compact
        />
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
