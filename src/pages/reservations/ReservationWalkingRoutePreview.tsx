import { LocateFixed, Route } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { OsmMapPicker, type MapOverlayMarker, type MapOverlays } from '../../components/ui/OsmMapPicker'
import { Button } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { stageCoordinates } from '../../lib/geo'
import type { WalkingRoute, WalkingRouteStage } from '../../types/app'
import { StationDetailsModal, stageKey, stageTitle } from '../walking-routes/StationInfoCard'

export function ReservationWalkingRoutePreview({
  routeId,
  routeName,
  originCityId,
  locationUserId,
  reservationId,
}: {
  routeId?: string | null
  routeName?: string | null
  originCityId?: string | null
  locationUserId?: string | null
  reservationId?: string | null
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  const selected = stages.find((stage) => stageKey(stage) === selectedId) ?? null
  const canSetLocation = Boolean(locationUserId && reservationId)

  async function setCaravanLocation(stage: WalkingRouteStage) {
    if (!locationUserId || !reservationId || saving) return
    setSaving(true)
    try {
      const coords = stageCoordinates(stage)
      await api.patch(`/users/${locationUserId}/location`, {
        provinceId: stage.city.provinceId,
        cityId: stage.cityId,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        reservationId,
        walkingStationId: stage.stationId ?? null,
        source: 'STATION',
      })
      toast.success(t('location.saved'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations', reservationId, 'travel-history'] }),
        queryClient.invalidateQueries({ queryKey: ['account'] }),
        queryClient.invalidateQueries({ queryKey: ['account', 'location-history'] }),
      ])
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

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
            onMarkerClick={(id) => setSelectedId(id)}
            heightClass="h-72"
          />
        </div>
      ) : query.isLoading ? null : (
        <p className="text-sm text-ink-500">{t('walkingRoutes.stationsNoMap')}</p>
      )}
      {selected ? (
        <StationDetailsModal
          stage={selected}
          locale={locale}
          onClose={() => setSelectedId(null)}
          headerAction={
            canSetLocation ? (
              <Button
                type="button"
                variant="soft"
                className="w-full sm:w-auto"
                disabled={saving}
                onClick={() => void setCaravanLocation(selected)}
              >
                <LocateFixed className="size-4" aria-hidden />
                {saving
                  ? t('reservations.setCaravanLocationSaving')
                  : t('reservations.setCaravanLocation', {
                      name: stageTitle(
                        selected,
                        locale,
                        `${t('walkingRoutes.stage')} ${formatNumber(selected.stageNumber, locale)}`,
                      ),
                    })}
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </section>
  )
}
