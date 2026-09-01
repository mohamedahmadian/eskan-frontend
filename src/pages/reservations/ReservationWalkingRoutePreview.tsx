import { Route } from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { OsmMapPicker, type MapOverlayMarker, type MapOverlays } from '../../components/ui/OsmMapPicker'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { stageCoordinates } from '../../lib/geo'
import type { WalkingRoute } from '../../types/app'
import { stageKey, stageTitle } from '../walking-routes/StationInfoCard'

export function ReservationWalkingRoutePreview({
  routeId,
  routeName,
  originCityId,
}: {
  routeId?: string | null
  routeName?: string | null
  originCityId?: string | null
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  const query = useQuery({
    queryKey: ['walking-route', routeId],
    enabled: Boolean(routeId),
    queryFn: async () => {
      const { data } = await api.get<WalkingRoute>(`/walking-routes/${routeId}`)
      return data
    },
  })

  const route = query.data
  const name = route?.name || routeName || ''
  const stages = useMemo(
    () => [...(route?.stages ?? [])].sort((a, b) => a.stageNumber - b.stageNumber),
    [route?.stages],
  )

  const overlays = useMemo<MapOverlays | null>(() => {
    if (!stages.length) return null
    const path: { lat: number; lng: number }[] = []
    const markers: MapOverlayMarker[] = []
    for (const stage of stages) {
      const coords = stageCoordinates(stage)
      if (!coords) continue
      path.push(coords)
      const numberLabel = formatNumber(stage.stageNumber, locale)
      markers.push({
        id: stageKey(stage),
        lat: coords.lat,
        lng: coords.lng,
        kind: originCityId && stage.cityId === originCityId ? 'current' : 'station',
        badge: numberLabel,
        title: stageTitle(stage, locale, `${t('walkingRoutes.stage')} ${numberLabel}`),
      })
    }
    if (!markers.length && path.length < 2) return null
    return {
      markers,
      path: path.length >= 2 ? path : undefined,
      fit: true,
      fitMaxZoom: 16,
    }
  }, [locale, originCityId, stages, t])

  if (!routeId) return null

  return (
    <section className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-xs font-semibold text-ink-600">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Route className="size-3.5" aria-hidden />
        </span>
        {t('reservations.walkingRoute')}
      </h3>
      {name ? (
        <p className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-2.5 text-sm font-semibold text-ink-900">
          {name}
        </p>
      ) : null}
      {overlays ? (
        <div className="overflow-hidden rounded-[22px] border border-teal-100 bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]">
          <OsmMapPicker
            latitude=""
            longitude=""
            onChange={() => undefined}
            variant="always"
            readOnly
            overlays={overlays}
            heightClass="h-72"
          />
        </div>
      ) : query.isLoading ? null : (
        <p className="text-sm text-ink-500">{t('walkingRoutes.stationsNoMap')}</p>
      )}
    </section>
  )
}
