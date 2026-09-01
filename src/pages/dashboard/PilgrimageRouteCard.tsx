import {
  ArrowRight,
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  Flag,
  Footprints,
  ListOrdered,
  LocateFixed,
  Map as MapIcon,
  MapPinned,
  Navigation,
  Radar,
  Route,
  type LucideIcon,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import { Button } from '../../components/ui/Form'
import { FormCard, FormEmptyHint } from '../../components/ui/FormLayout'
import { OsmMapPicker, type MapOverlayMarker, type MapOverlays } from '../../components/ui/OsmMapPicker'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { resolveWalkingProgress, stageCoordinates } from '../../lib/geo'
import type {
  City,
  ManagedUser,
  ReservationTravelHistoryList,
  WalkingRoute,
  WalkingRouteStage,
} from '../../types/app'
import {
  StationInfoCard,
  stageKey,
  stageTitle,
} from '../walking-routes/StationInfoCard'

type RouteTab = 'steps' | 'map'

const statTone = {
  teal: {
    wrap: 'bg-gradient-to-b from-teal-50 to-white ring-teal-100',
    icon: 'bg-teal-500 text-white shadow-[0_6px_12px_rgba(46,189,182,0.28)]',
    value: 'text-teal-800',
  },
  mint: {
    wrap: 'bg-gradient-to-b from-mint-50 to-white ring-mint-100',
    icon: 'bg-mint-500 text-white shadow-[0_6px_12px_rgba(63,214,190,0.24)]',
    value: 'text-mint-800',
  },
  gold: {
    wrap: 'bg-gradient-to-b from-gold-50 to-white ring-gold-100',
    icon: 'bg-gold-500 text-white shadow-[0_6px_12px_rgba(232,184,58,0.22)]',
    value: 'text-gold-600',
  },
  ink: {
    wrap: 'bg-gradient-to-b from-cream-50 to-white ring-line',
    icon: 'bg-ink-700 text-white',
    value: 'text-ink-800',
  },
}

function CompactStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: keyof typeof statTone
}) {
  const colors = statTone[tone]
  return (
    <article className={`flex items-center gap-2 rounded-2xl px-2.5 py-2 ring-1 ${colors.wrap}`}>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-ink-500">{label}</p>
        <p className={`truncate text-sm font-semibold leading-5 ${colors.value}`}>{value}</p>
      </div>
    </article>
  )
}

function routeDistanceKm(route: WalkingRoute | undefined, stages: WalkingRouteStage[]) {
  const fromRoute = route?.distanceToMashhadKm
  if (fromRoute != null && Number.isFinite(fromRoute)) return fromRoute
  const fromStart = stages[0]?.distanceToMashhadKm
  if (fromStart != null && Number.isFinite(fromStart)) return fromStart
  return stages.reduce((sum, stage) => sum + (stage.distanceToNextKm ?? 0), 0)
}

function remainingDistanceKm(stages: WalkingRouteStage[], currentIndex: number, totalKm: number) {
  if (currentIndex < 0) return totalKm
  const here = stages[currentIndex]
  if (here?.distanceToMashhadKm != null && Number.isFinite(here.distanceToMashhadKm)) {
    return Math.max(0, here.distanceToMashhadKm)
  }
  return Math.max(
    0,
    stages.slice(currentIndex).reduce((sum, stage) => sum + (stage.distanceToNextKm ?? 0), 0),
  )
}

function formatKm(value: number, locale: string, unit: string) {
  const rounded = Math.round(value * 10) / 10
  return `${formatNumber(rounded, locale)} ${unit}`
}

function useHydratedStages(route: WalkingRoute | undefined) {
  const rawStages = useMemo(
    () => [...(route?.stages ?? [])].sort((a, b) => a.stageNumber - b.stageNumber),
    [route?.stages],
  )
  const missingCityIds = useMemo(
    () =>
      [...new Set(rawStages.filter((stage) => !stageCoordinates(stage)).map((stage) => stage.cityId))],
    [rawStages],
  )
  const cityLookup = useQuery({
    queryKey: ['cities', 'stage-coords', missingCityIds],
    enabled: missingCityIds.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(
        missingCityIds.map(async (id) => {
          const { data } = await api.get<City>(`/cities/${id}`)
          return [id, data] as const
        }),
      )
      return Object.fromEntries(rows) as Record<string, City>
    },
  })
  return useMemo(
    () =>
      rawStages.map((stage) => {
        if (stageCoordinates(stage)) return stage
        const city = cityLookup.data?.[stage.cityId]
        if (!city) return stage
        return {
          ...stage,
          city: {
            ...stage.city,
            latitude: city.latitude,
            longitude: city.longitude,
          },
        }
      }),
    [cityLookup.data, rawStages],
  )
}

export function PilgrimageRouteCard({
  routeId,
  reservationId,
}: {
  routeId: string
  reservationId: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<RouteTab>('steps')
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showPassedStations, setShowPassedStations] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [savingHere, setSavingHere] = useState(false)

  const routeQuery = useQuery({
    queryKey: ['walking-route', routeId],
    queryFn: async () => {
      const { data } = await api.get<WalkingRoute>(`/walking-routes/${routeId}`)
      return data
    },
  })
  const accountQuery = useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>('/account')
      return data
    },
  })
  const travelQuery = useQuery({
    queryKey: ['reservations', reservationId, 'travel-history'],
    queryFn: async () => {
      const { data } = await api.get<ReservationTravelHistoryList>(
        `/reservations/${reservationId}/travel-history`,
      )
      return data.items
    },
  })
  const arrivals = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of [...(travelQuery.data ?? [])].reverse()) {
      if (item.walkingRouteStageId && !map.has(item.walkingRouteStageId)) {
        map.set(item.walkingRouteStageId, item.createdAt)
      }
    }
    return map
  }, [travelQuery.data])

  const stages = useHydratedStages(routeQuery.data)
  const preview =
    stages.find((stage) => stageKey(stage) === previewId) ??
    (currentIndex >= 0 ? stages[currentIndex] : null) ??
    stages[0] ??
    null
  const n = (value: number) => formatNumber(value, locale)
  const stationTotal = stages.length
  const stationPassed = currentIndex < 0 ? 0 : currentIndex
  const stationRemaining = Math.max(0, stationTotal - stationPassed)
  const distanceTotal = routeDistanceKm(routeQuery.data, stages)
  const distanceRemaining = remainingDistanceKm(stages, currentIndex, distanceTotal)
  const distancePassed = Math.max(0, distanceTotal - distanceRemaining)
  const km = t('walkingRoutes.km')

  const locationKey = `${accountQuery.data?.locationCityId ?? ''}:${accountQuery.data?.latitude ?? ''}:${accountQuery.data?.longitude ?? ''}`
  useEffect(() => {
    const user = accountQuery.data
    if (!user || !stages.length) return
    if (user.locationCityId == null && user.latitude == null) return
    const progress = resolveWalkingProgress(stages, {
      cityId: user.locationCityId,
      lat: user.latitude,
      lng: user.longitude,
    })
    setCurrentIndex(progress.index)
  }, [accountQuery.data, locationKey, stages])

  const atLastStation = stationTotal > 0 && currentIndex === stationTotal - 1
  const hasPassedStations = currentIndex > 0 && !atLastStation
  const hidePassedStations = hasPassedStations && !showPassedStations
  const visibleStages = useMemo(
    () =>
      stages
        .map((stage, index) => ({ stage, index }))
        .filter(({ index }) => !hidePassedStations || index >= currentIndex),
    [currentIndex, hidePassedStations, stages],
  )

  useEffect(() => {
    if (tab !== 'steps' || !stages.length) return
    const index = currentIndex >= 0 ? currentIndex : 0
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`pilgrimage-stage-${index}`)
        ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [currentIndex, hidePassedStations, stages.length, tab])

  const overlays = useMemo<MapOverlays | null>(() => {
    if (!stages.length) return null
    const path: { lat: number; lng: number }[] = []
    const markers: MapOverlayMarker[] = []
    const fitPoints: { lat: number; lng: number }[] = []
    const atEnd = currentIndex >= 0 && currentIndex === stages.length - 1
    const remainingStart = currentIndex < 0 || atEnd ? 0 : currentIndex
    stages.forEach((stage, index) => {
      const coords = stageCoordinates(stage)
      if (!coords) return
      path.push(coords)
      const id = stageKey(stage)
      const numberLabel = formatNumber(stage.stageNumber, locale)
      const fallback = `${t('walkingRoutes.stage')} ${numberLabel}`
      markers.push({
        id,
        lat: coords.lat,
        lng: coords.lng,
        kind: index < currentIndex ? 'previous' : index === currentIndex ? 'current' : 'station',
        badge: numberLabel,
        title: stageTitle(stage, locale, fallback),
      })
      if (index >= remainingStart) fitPoints.push(coords)
    })
    if (!markers.length && path.length < 2) return null
    return {
      markers,
      path: path.length >= 2 ? path : undefined,
      fit: true,
      fitPoints: fitPoints.length ? fitPoints : undefined,
      fitMaxZoom: 16,
    }
  }, [currentIndex, locale, stages, t])

  function openStage(stage: WalkingRouteStage) {
    setPreviewId(stageKey(stage))
  }

  function hereAction(stage: WalkingRouteStage) {
    const fallbackName = (item: WalkingRouteStage) =>
      stageTitle(item, locale, `${t('walkingRoutes.stage')} ${formatNumber(item.stageNumber, locale)}`)
    const index = stages.findIndex((item) => stageKey(item) === stageKey(stage))
    const previous = index > 0 ? stages[index - 1] : null
    const to = fallbackName(stage)
    const from = previous ? fallbackName(previous) : null
    return (
      <Button
        type="button"
        variant="soft"
        className="w-full sm:w-auto"
        disabled={savingHere}
        onClick={() => void saveHereAtStation(stage)}
      >
        <LocateFixed className="size-4" aria-hidden />
        {savingHere
          ? t('dashboard.iAmHereSaving')
          : from
            ? t('dashboard.iAmHere', { from, to })
            : t('dashboard.iAmHereFirst', { to })}
      </Button>
    )
  }

  async function saveHereAtStation(stage: WalkingRouteStage) {
    if (savingHere) return
    setSavingHere(true)
    try {
      const coords = stageCoordinates(stage)
      await api.patch('/account/location', {
        provinceId: stage.city.provinceId,
        cityId: stage.cityId,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        notes: accountQuery.data?.locationNotes ?? null,
        reservationId,
        walkingRouteStageId: stage.id ?? null,
        source: 'STATION',
      })
      const index = stages.findIndex((item) => stageKey(item) === stageKey(stage))
      if (index >= 0) setCurrentIndex(index)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account'] }),
        queryClient.invalidateQueries({ queryKey: ['account', 'location-history'] }),
        queryClient.invalidateQueries({ queryKey: ['reservations', reservationId, 'travel-history'] }),
      ])
      toast.success(t('location.saved'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSavingHere(false)
    }
  }

  return (
    <FormCard
      icon={Route}
      title={t('dashboard.pilgrimageRouteTitle')}
      subtitle={routeQuery.data?.name}
      action={
        <Link to="/my-location/history">
          <Button type="button" variant="ghost">
            <Radar className="size-4" aria-hidden />
            {t('location.openTrail')}
          </Button>
        </Link>
      }
    >
      <div className="space-y-4 p-5 sm:p-6">
        {stationTotal > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <CompactStat
              icon={MapPinned}
              label={t('dashboard.routeStatStations')}
              value={n(stationTotal)}
              tone="teal"
            />
            <CompactStat
              icon={CircleCheck}
              label={t('dashboard.routeStatPassed')}
              value={n(stationPassed)}
              tone="mint"
            />
            <CompactStat
              icon={Flag}
              label={t('dashboard.routeStatRemaining')}
              value={n(stationRemaining)}
              tone="gold"
            />
            <CompactStat
              icon={Route}
              label={t('dashboard.routeStatDistance')}
              value={formatKm(distanceTotal, locale, km)}
              tone="teal"
            />
            <CompactStat
              icon={Footprints}
              label={t('dashboard.routeStatDistancePassed')}
              value={formatKm(distancePassed, locale, km)}
              tone="mint"
            />
            <CompactStat
              icon={Navigation}
              label={t('dashboard.routeStatDistanceRemaining')}
              value={formatKm(distanceRemaining, locale, km)}
              tone="ink"
            />
          </div>
        ) : null}

        <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50 p-1.5">
          {(
            [
              { id: 'steps' as const, icon: ListOrdered, label: t('dashboard.pilgrimageRouteSteps') },
              { id: 'map' as const, icon: MapIcon, label: t('dashboard.pilgrimageRouteMap') },
            ]
          ).map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                    : 'bg-white text-ink-700 hover:bg-cream-100'
                }`}
              >
                <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
                {item.label}
              </button>
            )
          })}
        </nav>

        {routeQuery.isLoading ? (
          <p className="text-sm text-ink-500">{t('common.loading')}</p>
        ) : routeQuery.isError ? (
          <p className="text-sm text-ink-700">{t('common.error')}</p>
        ) : stages.length === 0 ? (
          <FormEmptyHint>{t('walkingRoutes.stagesEmpty')}</FormEmptyHint>
        ) : tab === 'steps' ? (
          <div className="space-y-3">
            {hasPassedStations ? (
              <div className="flex justify-end">
              <Button
                type="button"
                variant="soft"
                onClick={() => setShowPassedStations((open) => !open)}
              >
                {showPassedStations ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
                {showPassedStations
                  ? t('dashboard.hidePassedStations')
                  : t('dashboard.showPassedStations')}
              </Button>
              </div>
            ) : null}
            <div dir="ltr" className="overflow-x-auto pb-1">
              <ol className="flex min-w-min items-start px-1 py-2">
                {visibleStages.map(({ stage, index }, visibleIndex) => {
                  const title = stageTitle(
                    stage,
                    locale,
                    `${t('walkingRoutes.stage')} ${n(stage.stageNumber)}`,
                  )
                  const passed = currentIndex >= 0 && index < currentIndex
                  const current = index === currentIndex
                  const previewed = preview != null && stageKey(stage) === stageKey(preview)
                  const enlarge = hidePassedStations
                  return (
                    <Fragment key={stageKey(stage)}>
                      {visibleIndex > 0 ? (
                        <li
                          aria-hidden
                          className={`flex shrink-0 items-center px-0.5 ${
                            enlarge ? 'h-12 sm:h-14' : 'h-8 sm:h-9'
                          }`}
                        >
                          <ArrowRight
                            className={`${enlarge ? 'size-5' : 'size-3.5'} ${
                              passed
                                ? 'text-[#34d399]'
                                : current
                                  ? 'text-teal-400'
                                  : 'text-teal-200'
                            }`}
                            strokeWidth={2.4}
                          />
                        </li>
                      ) : null}
                      <li
                        id={`pilgrimage-stage-${index}`}
                        className={`shrink-0 ${enlarge ? 'w-28 sm:w-32' : 'w-16 sm:w-[4.5rem]'}`}
                      >
                        <button
                          type="button"
                          onClick={() => openStage(stage)}
                          aria-current={current ? 'step' : undefined}
                          aria-pressed={previewed}
                          className="flex w-full cursor-pointer flex-col items-center"
                        >
                          <span
                            className={`relative flex items-center justify-center rounded-full font-semibold transition ${
                              enlarge
                                ? 'size-12 text-sm sm:size-14 sm:text-base'
                                : 'size-8 text-[11px] sm:size-9'
                            } ${
                              passed
                                ? `bg-gradient-to-b from-[#34d399] to-[#16a34a] text-white shadow-[0_8px_16px_rgba(22,163,74,0.28)] ring-2 ${previewed ? 'ring-[#166534] ring-offset-2' : 'ring-[#bbf7d0]'}`
                                : current
                                  ? `bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.32)] ring-2 ${previewed ? 'ring-teal-700 ring-offset-2' : 'ring-teal-100'}`
                                  : `bg-white text-teal-800 ring-2 hover:ring-teal-300 ${previewed ? 'ring-teal-500 ring-offset-2' : 'ring-teal-100'}`
                            }`}
                          >
                            {passed ? (
                              <Check
                                className={`pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-white/40 ${
                                  enlarge ? 'size-4 sm:size-5' : 'size-3'
                                }`}
                                strokeWidth={2.6}
                                aria-hidden
                              />
                            ) : null}
                            <span className="relative">{n(stage.stageNumber)}</span>
                          </span>
                          <span
                            className={`mt-1.5 line-clamp-2 text-center font-medium leading-tight ${
                              enlarge ? 'text-xs sm:text-sm' : 'text-[10px]'
                            } ${passed ? 'text-[#166534]' : 'text-ink-700'}`}
                          >
                            {title}
                          </span>
                          {stage.id && arrivals.get(stage.id) ? (
                            <span
                              className={`mt-1 text-center leading-tight ${
                                enlarge ? 'text-[10px] sm:text-xs' : 'text-[9px]'
                              } ${passed ? 'text-[#15803d]' : 'text-teal-700'}`}
                            >
                              <span className={`mb-0.5 block ${passed ? 'text-[#16a34a]' : 'text-ink-400'}`}>
                                {t('dashboard.arrivedAt')}
                              </span>
                              <DateText value={arrivals.get(stage.id)} withTime stacked />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    </Fragment>
                  )
                })}
              </ol>
            </div>
          </div>
        ) : overlays ? (
          <div className="overflow-hidden rounded-2xl ring-1 ring-teal-100">
            <OsmMapPicker
              latitude=""
              longitude=""
              onChange={() => undefined}
              active={tab === 'map'}
              variant="always"
              readOnly
              overlays={overlays}
              onMarkerClick={(id) => {
                const stage = stages.find((item) => stageKey(item) === id)
                if (!stage) return
                openStage(stage)
              }}
              heightClass="h-72 sm:h-80"
            />
          </div>
        ) : (
          <FormEmptyHint>{t('walkingRoutes.stationsNoMap')}</FormEmptyHint>
        )}
        {preview && stages.length > 0 && !routeQuery.isLoading && !routeQuery.isError ? (
          <StationInfoCard
            stage={preview}
            locale={locale}
            className="h-auto"
            headerAction={hereAction(preview)}
          />
        ) : null}
      </div>

    </FormCard>
  )
}
