import { ArrowLeft, ArrowRight, Flag, MapPin, Route } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MapOverlayMarker, MapOverlays } from '../../components/ui/OsmMapPicker'
import { formatNumber } from '../../lib/datetime'
import { geoName, resolveWalkingProgress, stageCoordinates } from '../../lib/geo'
import type { WalkingRoute, WalkingRouteStage } from '../../types/app'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function kmLabel(value: number | null, locale: string, unit: string) {
  if (value == null) return null
  return `${formatNumber(value, locale)} ${unit}`
}

export function useWalkingRouteMap(
  route: WalkingRoute | null | undefined,
  here: { cityId?: string | null; lat?: number | null; lng?: number | null },
) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  return useMemo(() => {
    if (!route?.stages.length) {
      return { progress: null, overlays: null as MapOverlays | null }
    }
    const progress = resolveWalkingProgress(route.stages, here)
    const unit = t('walkingRoutes.km')
    const markers: MapOverlayMarker[] = []
    const path: { lat: number; lng: number }[] = []

    function addMarker(
      stage: WalkingRouteStage | null,
      kind: MapOverlayMarker['kind'],
      badge: string,
    ) {
      if (!stage) return
      const coords = stageCoordinates(stage)
      if (!coords) return
      const city = geoName(stage.city, locale)
      const title = stage.name?.trim() || city
      const facts = [
        `${t('walkingRoutes.stage')} ${formatNumber(stage.stageNumber, locale)}`,
        kmLabel(stage.distanceToPreviousKm, locale, unit)
          ? `${t('walkingRoutes.distanceToPreviousKm')}: ${kmLabel(stage.distanceToPreviousKm, locale, unit)}`
          : null,
        kmLabel(stage.distanceToNextKm, locale, unit)
          ? `${t('walkingRoutes.distanceToNextKm')}: ${kmLabel(stage.distanceToNextKm, locale, unit)}`
          : null,
        kmLabel(stage.distanceToMashhadKm, locale, unit)
          ? `${t('walkingRoutes.stageDistanceToMashhadKm')}: ${kmLabel(stage.distanceToMashhadKm, locale, unit)}`
          : null,
        stage.description,
      ].filter(Boolean) as string[]
      markers.push({
        id: `${kind}-${stage.id ?? stage.cityId}`,
        lat: coords.lat,
        lng: coords.lng,
        kind,
        badge: escapeHtml(badge),
        title: escapeHtml(title),
        popupHtml: `<div class="eskan-route-popup-body" dir="${document.documentElement.dir}"><strong>${escapeHtml(title)}</strong><p>${facts.map((line) => escapeHtml(line)).join('</p><p>')}</p></div>`,
      })
      path.push(coords)
    }

    addMarker(progress.previous, 'previous', t('location.previousStation'))
    addMarker(progress.current, 'current', t('location.currentStation'))
    addMarker(progress.next, 'next', t('location.nextStation'))

    return {
      progress,
      overlays:
        markers.length > 0
          ? { markers, path: path.length >= 2 ? path : undefined, fit: true }
          : null,
    }
  }, [here.cityId, here.lat, here.lng, locale, route, t])
}

function StationCard({
  kind,
  stage,
}: {
  kind: 'previous' | 'current' | 'next'
  stage: WalkingRouteStage | null
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const empty = '—'
  const tone = {
    previous: {
      wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
      icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190),0.24)]',
      chip: 'bg-mint-100 text-mint-700',
    },
    current: {
      wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
      icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
      chip: 'bg-teal-100 text-teal-800',
    },
    next: {
      wrap: 'border-teal-100 bg-gradient-to-b from-white via-teal-50/80 to-mint-50',
      icon: 'bg-teal-600 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
      chip: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100',
    },
  }[kind]
  const Icon = kind === 'previous' ? ArrowRight : kind === 'next' ? ArrowLeft : Flag
  const title =
    kind === 'previous'
      ? t('location.previousStation')
      : kind === 'next'
        ? t('location.nextStation')
        : t('location.currentStation')

  return (
    <article className={`relative overflow-hidden rounded-2xl border px-3.5 py-3.5 ${tone.wrap}`}>
      <div
        className="pointer-events-none absolute -end-6 -top-8 size-20 rounded-full bg-white/60"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}>
            {title}
          </p>
          {stage ? (
            <>
              <p className="mt-1.5 truncate text-sm font-semibold text-ink-900">
                {stage.name?.trim() || geoName(stage.city, locale)}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {t('walkingRoutes.stage')} {formatNumber(stage.stageNumber, locale)}
                {stage.city.province ? ` · ${geoName(stage.city.province, locale)}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stage.distanceToPreviousKm != null ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-ink-600 ring-1 ring-line">
                    {t('walkingRoutes.distanceToPreviousKm')}:{' '}
                    {formatNumber(stage.distanceToPreviousKm, locale)} {t('walkingRoutes.km')}
                  </span>
                ) : null}
                {stage.distanceToNextKm != null ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-ink-600 ring-1 ring-line">
                    {t('walkingRoutes.distanceToNextKm')}:{' '}
                    {formatNumber(stage.distanceToNextKm, locale)} {t('walkingRoutes.km')}
                  </span>
                ) : null}
                {stage.distanceToMashhadKm != null ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-ink-600 ring-1 ring-line">
                    {t('walkingRoutes.stageDistanceToMashhadKm')}:{' '}
                    {formatNumber(stage.distanceToMashhadKm, locale)} {t('walkingRoutes.km')}
                  </span>
                ) : null}
              </div>
              {stage.description ? (
                <p className="mt-2 text-xs leading-6 text-ink-600">{stage.description}</p>
              ) : null}
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink-400">
              {kind === 'previous'
                ? t('location.noPreviousStation')
                : kind === 'next'
                  ? t('location.noNextStation')
                  : empty}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export function WalkingRouteProgress({
  route,
  here,
}: {
  route: WalkingRoute
  here: { cityId?: string | null; lat?: number | null; lng?: number | null }
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { progress } = useWalkingRouteMap(route, here)
  if (!progress) return null

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
          <Route className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-teal-700">{t('location.routeTitle')}</p>
          <p className="truncate text-sm font-semibold text-ink-900">{route.name}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {t('walkingRoutes.distanceToMashhadKm')}:{' '}
            {formatNumber(route.distanceToMashhadKm, locale)} {t('walkingRoutes.km')}
            {' · '}
            {route.entryBorder.name}
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        <StationCard kind="previous" stage={progress.previous} />
        <StationCard kind="current" stage={progress.current} />
        <StationCard kind="next" stage={progress.next} />
      </div>
      {!progress.current ? (
        <p className="flex items-center gap-2 text-xs text-ink-400">
          <MapPin className="size-3.5 shrink-0 text-teal-600" aria-hidden />
          {t('location.routeHint')}
        </p>
      ) : null}
    </section>
  )
}
