import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { MapOverlayMarker, MapOverlays } from '../../components/ui/OsmMapPicker'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { GeoName, UserLocationHistoryItem, UserLocationHistoryList } from '../../types/app'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function locationHistoryOverlays(
  mapPoints: UserLocationHistoryItem[],
  options: {
    locale: string
    geoName: (item?: GeoName | null) => string
    t: TFunction
    fit?: boolean
  },
): MapOverlays | null {
  if (!mapPoints.length) return null
  const { locale, geoName, t, fit = true } = options
  const markers: MapOverlayMarker[] = mapPoints.map((point) => {
    const place = [point.city ? geoName(point.city) : null, point.province ? geoName(point.province) : null]
      .filter(Boolean)
      .join(' · ')
    const facts = [place || null, point.notes].filter(Boolean) as string[]
    const seq = escapeHtml(formatNumber(point.seq, locale))
    return {
      id: point.id,
      lat: point.latitude as number,
      lng: point.longitude as number,
      kind: 'history',
      badge: seq,
      title: escapeHtml(place || t('location.historySeq')),
      popupHtml: `<div class="eskan-route-popup-body" dir="${document.documentElement.dir}"><strong>${seq}</strong>${
        facts.length ? `<p>${facts.map((line) => escapeHtml(line)).join('</p><p>')}</p>` : ''
      }</div>`,
    }
  })
  return {
    markers,
    path: mapPoints.map((point) => ({
      lat: point.latitude as number,
      lng: point.longitude as number,
    })),
    fit,
  }
}

export function useLocationHistoryOverlays(mapPoints: UserLocationHistoryItem[] | undefined) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  return useMemo(
    () => locationHistoryOverlays(mapPoints ?? [], { locale, geoName, t }),
    [geoName, locale, mapPoints, t],
  )
}

export function useAccountLocationHistoryMap(enabled: boolean) {
  return useQuery({
    queryKey: ['account', 'location-history', 'map'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<UserLocationHistoryList>('/account/location-history', {
        params: { pageSize: 1 },
      })
      return data.mapPoints
    },
  })
}
