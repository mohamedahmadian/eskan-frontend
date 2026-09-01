import { Clock3, MapPin, Milestone, Route } from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { OsmMapPicker, type MapOverlayMarker, type MapOverlays } from '../../components/ui/OsmMapPicker'
import { FormCard, FormEmptyHint, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { ReservationTravelHistoryItem, ReservationTravelHistoryList } from '../../types/app'

function historyCoordinates(item: ReservationTravelHistoryItem) {
  if (item.latitude != null && item.longitude != null) {
    return { lat: item.latitude, lng: item.longitude }
  }
  const stage = item.walkingRouteStage
  if (stage?.latitude != null && stage.longitude != null) {
    return { lat: stage.latitude, lng: stage.longitude }
  }
  const city = item.city
  if (city?.latitude != null && city.longitude != null) {
    return { lat: city.latitude, lng: city.longitude }
  }
  return null
}

export function ReservationTravelHistoryCard({ reservationId }: { reservationId: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const query = useQuery({
    queryKey: ['reservations', reservationId, 'travel-history'],
    queryFn: async () => {
      const { data } = await api.get<ReservationTravelHistoryList>(
        `/reservations/${reservationId}/travel-history`,
      )
      return data.items
    },
  })
  const items = query.data ?? []
  const overlays = useMemo<MapOverlays | null>(() => {
    const ordered = [...items].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    )
    const path: { lat: number; lng: number }[] = []
    const markers: MapOverlayMarker[] = []
    ordered.forEach((item, index) => {
      const coords = historyCoordinates(item)
      if (!coords) return
      path.push(coords)
      const numberLabel = formatNumber(index + 1, locale)
      const station =
        item.walkingRouteStage?.name?.trim() ||
        (item.walkingRouteStage
          ? `${t('walkingRoutes.stage')} ${formatNumber(item.walkingRouteStage.stageNumber, locale)}`
          : item.city
            ? nameOf(item.city)
            : numberLabel)
      markers.push({
        id: item.id,
        lat: coords.lat,
        lng: coords.lng,
        kind: 'history',
        badge: numberLabel,
        title: station,
      })
    })
    if (!markers.length) return null
    return {
      markers,
      path: path.length >= 2 ? path : undefined,
      fit: true,
      fitMaxZoom: 16,
    }
  }, [items, locale, nameOf, t])

  return (
    <FormCard icon={Route} title={t('reservations.travelHistory')}>
      <div className="space-y-3 p-5 sm:p-6">
        {query.isLoading ? (
          <p className="text-sm text-ink-500">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <FormEmptyHint>{t('reservations.travelHistoryEmpty')}</FormEmptyHint>
        ) : (
          <>
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
            ) : null}
          <ul className="space-y-3">
            {items.map((item) => {
              const place = [item.city ? nameOf(item.city) : null, item.province ? nameOf(item.province) : null]
                .filter(Boolean)
                .join(' · ')
              const station =
                item.walkingRouteStage != null
                  ? item.walkingRouteStage.name?.trim() ||
                    `${t('walkingRoutes.stage')} ${formatNumber(item.walkingRouteStage.stageNumber, locale)}`
                  : ''
              const coords =
                item.latitude != null && item.longitude != null
                  ? `${formatNumber(item.latitude, locale)} ، ${formatNumber(item.longitude, locale)}`
                  : ''
              return (
                <li key={item.id} className="rounded-2xl border border-line bg-cream-50/60 p-3 sm:p-4">
                  <FormSectionTitle icon={Clock3} className="mb-2">
                    <DateText value={item.createdAt} withTime />
                  </FormSectionTitle>
                  <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                    {station ? (
                      <FormFactTile
                        icon={Milestone}
                        label={t('reservations.travelHistoryStation')}
                        value={station}
                        tone="teal"
                      />
                    ) : null}
                    {place ? (
                      <FormFactTile
                        icon={MapPin}
                        label={t('reservations.travelHistoryPlace')}
                        value={place}
                        tone="mint"
                      />
                    ) : null}
                    {coords ? (
                      <FormFactTile
                        icon={Route}
                        label={t('reservations.travelHistoryCoords')}
                        value={<span dir="ltr">{coords}</span>}
                        tone="ink"
                      />
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
          </>
        )}
      </div>
    </FormCard>
  )
}
