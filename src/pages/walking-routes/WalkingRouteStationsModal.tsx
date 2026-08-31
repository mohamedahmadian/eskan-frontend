import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ListOrdered,
  Map as MapIcon,
  Route,
  Search,
  Table2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppForm, Button } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { TableCard } from '../../components/ui/ListControls'
import { OsmMapPicker, type MapOverlayMarker, type MapOverlays } from '../../components/ui/OsmMapPicker'
import { languageDir } from '../../i18n'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { geoName, stageCoordinates, useGeoName } from '../../lib/geo'
import type { City, WalkingRoute, WalkingRouteStage } from '../../types/app'
import {
  StationDetailsOverlay,
  StationInfoCard,
  stageKey,
  stageTitle,
} from './StationInfoCard'

function matchesStationQuery(
  stage: WalkingRouteStage,
  query: string,
  locale: string,
) {
  const term = query.trim().toLowerCase()
  if (!term) return true
  const haystack = [
    stage.name,
    geoName(stage.city, locale),
    geoName(stage.city.province, locale),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(term)
}

type StationsTab = 'map' | 'table' | 'steps'

export function WalkingRouteStationsModal({
  routeId,
  initialRoute,
  onClose,
}: {
  routeId: string
  initialRoute?: WalkingRoute
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const [term, setTerm] = useState('')
  const [tab, setTab] = useState<StationsTab>('map')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wizardIndex, setWizardIndex] = useState(0)

  const query = useQuery({
    queryKey: ['walking-route', routeId],
    queryFn: async () => {
      const { data } = await api.get<WalkingRoute>(`/walking-routes/${routeId}`)
      return data
    },
    initialData: initialRoute,
  })

  const route = query.data

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
  const stages = useMemo(
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
  const filtered = useMemo(
    () => stages.filter((stage) => matchesStationQuery(stage, term, locale)),
    [locale, stages, term],
  )

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (selectedId) {
          setSelectedId(null)
          return
        }
        onClose()
        return
      }
      if (tab !== 'steps') return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const rtl = languageDir(locale) === 'rtl'
      const goNext = rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight'
      setWizardIndex((index) => {
        const next = index + (goNext ? 1 : -1)
        if (next < 0 || next >= stages.length) return index
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [locale, onClose, selectedId, stages.length, tab])

  useEffect(() => {
    if (selectedId && !filtered.some((stage) => stageKey(stage) === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  useEffect(() => {
    if (wizardIndex >= stages.length) {
      setWizardIndex(Math.max(0, stages.length - 1))
    }
  }, [stages.length, wizardIndex])

  useEffect(() => {
    if (tab !== 'steps') return
    document
      .getElementById(`wizard-step-${wizardIndex}`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [tab, wizardIndex])

  const selected = filtered.find((stage) => stageKey(stage) === selectedId) ?? null
  const wizardStage = stages[wizardIndex] ?? null
  const n = (value: number) => formatNumber(value, locale)
  const km = (value: number | null | undefined) =>
    value == null ? '—' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`

  const overlays = useMemo<MapOverlays | null>(() => {
    if (!stages.length) return null
    const path: { lat: number; lng: number }[] = []
    for (const stage of stages) {
      const coords = stageCoordinates(stage)
      if (coords) path.push(coords)
    }
    const markers: MapOverlayMarker[] = []
    for (const stage of filtered) {
      const coords = stageCoordinates(stage)
      if (!coords) continue
      const id = stageKey(stage)
      const numberLabel = formatNumber(stage.stageNumber, locale)
      const fallback = `${t('walkingRoutes.stage')} ${numberLabel}`
      markers.push({
        id,
        lat: coords.lat,
        lng: coords.lng,
        kind: selectedId === id ? 'current' : 'station',
        badge: numberLabel,
        title: stageTitle(stage, locale, fallback),
      })
    }
    if (!markers.length && !path.length) return null
    return {
      markers,
      path: path.length >= 2 ? path : undefined,
      fit: true,
      fitMaxZoom: 16,
    }
  }, [filtered, locale, selectedId, stages, t])

  function closeStationCard() {
    setSelectedId(null)
  }

  function showDetails(stage: WalkingRouteStage) {
    setSelectedId(stageKey(stage))
  }

  function goWizard(delta: number) {
    setWizardIndex((index) => {
      const next = index + delta
      if (next < 0 || next >= stages.length) return index
      return next
    })
  }

  const emptyFiltered = Boolean(term.trim()) && filtered.length === 0

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-cream-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walking-route-stations-title"
    >
      <header className="shrink-0 border-b border-line bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(20,40,40,0.04)] sm:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <Route className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="walking-route-stations-title"
                className="truncate text-base font-semibold text-ink-900"
              >
                {t('walkingRoutes.stationsModalTitle')}
              </h2>
              <p className="truncate text-xs text-ink-500">
                {route?.name}
                {route ? ` · ${t('walkingRoutes.stageCountChip', { value: n(route.stages.length) })}` : ''}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="size-4" aria-hidden />
            {t('walkingRoutes.stationsModalClose')}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3 px-3 py-3 sm:px-5">
        {tab !== 'steps' ? (
          <AppForm
            autoFocusFirst={false}
            onSubmit={() => undefined}
            className="shrink-0 rounded-[22px] border border-line bg-white p-3 shadow-[0_10px_30px_rgba(20,40,40,0.05)]"
          >
            <label className="sr-only" htmlFor="station-modal-search">
              {t('walkingRoutes.stationsSearch')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-teal-600" />
              <input
                id="station-modal-search"
                className="w-full rounded-2xl border border-line bg-cream-50 py-2.5 ps-10 pe-3 text-sm text-ink-900 placeholder:text-ink-400"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t('walkingRoutes.stationsSearchPlaceholder')}
                autoComplete="off"
                autoFocus
              />
            </div>
          </AppForm>
        ) : null}

        <nav className="flex shrink-0 flex-wrap gap-2 rounded-2xl border border-line bg-white p-2">
          {(
            [
              { id: 'map' as const, icon: MapIcon, label: t('walkingRoutes.tabs.map') },
              { id: 'table' as const, icon: Table2, label: t('walkingRoutes.tabs.table') },
              { id: 'steps' as const, icon: ListOrdered, label: t('walkingRoutes.tabs.steps') },
            ]
          ).map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'steps') {
                    setWizardIndex(0)
                    setSelectedId(null)
                  }
                  setTab(item.id)
                }}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                    : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
                }`}
              >
                <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="relative min-h-0 flex-1">
          {tab === 'steps' ? (
            stages.length === 0 || !wizardStage ? (
              <FormEmptyHint>{t('walkingRoutes.stagesEmpty')}</FormEmptyHint>
            ) : (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="shrink-0 rounded-[22px] border border-line bg-white px-3 py-2.5 shadow-[0_10px_30px_rgba(20,40,40,0.05)] sm:px-4">
                  <p className="mb-2 text-sm font-semibold text-ink-800">
                    {t('walkingRoutes.stepOf', {
                      current: n(wizardIndex + 1),
                      total: n(stages.length),
                    })}
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {stages.map((stage, index) => {
                      const active = index === wizardIndex
                      return (
                        <button
                          key={stageKey(stage)}
                          id={`wizard-step-${index}`}
                          type="button"
                          onClick={() => setWizardIndex(index)}
                          aria-current={active ? 'step' : undefined}
                          className={`flex size-9 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold transition ${
                            active
                              ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
                          }`}
                        >
                          {n(stage.stageNumber)}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <StationInfoCard stage={wizardStage} locale={locale} />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={wizardIndex <= 0}
                    onClick={() => goWizard(-1)}
                  >
                    <ChevronRight className="size-4 ltr:rotate-180" aria-hidden />
                    {t('walkingRoutes.prevStage')}
                  </Button>
                  <Button
                    type="button"
                    className="ms-auto"
                    disabled={wizardIndex >= stages.length - 1}
                    onClick={() => goWizard(1)}
                  >
                    {t('walkingRoutes.nextStage')}
                    <ChevronLeft className="size-4 ltr:rotate-180" aria-hidden />
                  </Button>
                </div>
              </div>
            )
          ) : emptyFiltered ? (
            <FormEmptyHint>{t('walkingRoutes.stationsSearchEmpty')}</FormEmptyHint>
          ) : tab === 'map' ? (
            stages.length === 0 ? (
              <FormEmptyHint>{t('walkingRoutes.stagesEmpty')}</FormEmptyHint>
            ) : overlays ? (
              <div className="relative h-full min-h-[22rem]">
                <OsmMapPicker
                  latitude=""
                  longitude=""
                  onChange={() => undefined}
                  active={tab === 'map'}
                  variant="always"
                  readOnly
                  fill
                  overlays={overlays}
                  onMarkerClick={(id) => setSelectedId(id)}
                />
              </div>
            ) : (
              <FormEmptyHint>{t('walkingRoutes.stationsNoMap')}</FormEmptyHint>
            )
          ) : (
            <div className="h-full overflow-auto">
              <TableCard
                empty={t('walkingRoutes.stagesEmpty')}
                hasRows={filtered.length > 0}
                rowClick={false}
              >
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.stage')}</th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('walkingRoutes.stationName')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">{t('geo.province')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.city')}</th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('walkingRoutes.distanceToPreviousKm')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('walkingRoutes.distanceToNextKm')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('walkingRoutes.stageDistanceToMashhadKm')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('walkingRoutes.managerName')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((stage) => {
                      const title = stageTitle(
                        stage,
                        locale,
                        `${t('walkingRoutes.stage')} ${n(stage.stageNumber)}`,
                      )
                      return (
                        <tr key={stageKey(stage)} className="border-t border-line">
                          <td className="px-4 py-3">{n(stage.stageNumber)}</td>
                          <td className="px-4 py-3">{title}</td>
                          <td className="px-4 py-3">{name(stage.city.province)}</td>
                          <td className="px-4 py-3">{name(stage.city)}</td>
                          <td className="px-4 py-3">{km(stage.distanceToPreviousKm)}</td>
                          <td className="px-4 py-3">{km(stage.distanceToNextKm)}</td>
                          <td className="px-4 py-3">{km(stage.distanceToMashhadKm)}</td>
                          <td className="px-4 py-3">{stage.managerName?.trim() || '—'}</td>
                          <td className="px-4 py-3">
                            <Button type="button" variant="soft" onClick={() => showDetails(stage)}>
                              <Eye className="size-4" aria-hidden />
                              {t('walkingRoutes.viewDetails')}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableCard>
            </div>
          )}
          {selected && tab !== 'steps' ? (
            <StationDetailsOverlay
              stage={selected}
              locale={locale}
              onClose={closeStationCard}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
