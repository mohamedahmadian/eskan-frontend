import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatNumber } from '../../lib/datetime'
import type {
  ProvincialMonitoringCityPlace,
  ProvincialMonitoringPlace,
} from '../../types/app'
import { geoName } from '../../lib/geo'
import { heatColor } from './monitoringShared'

const IRAN_BOUNDS = L.latLngBounds([24.4, 43.9], [40.0, 63.5])

export type MapMetric = 'pilgrims' | 'caravans' | 'residents'

function metricValue(place: ProvincialMonitoringPlace, metric: MapMetric) {
  if (metric === 'caravans') return place.caravanCount
  if (metric === 'residents') return place.residentPilgrims
  return place.reservationPilgrims.total
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function IranMonitoringMap({
  provinces,
  cities,
  metric,
  showCities,
  locale,
  onProvinceClick,
  onCityClick,
  focus,
}: {
  provinces: ProvincialMonitoringPlace[]
  cities: ProvincialMonitoringCityPlace[]
  metric: MapMetric
  showCities: boolean
  locale: string
  onProvinceClick: (id: string) => void
  onCityClick: (id: string) => void
  focus?: {
    latitude: number | null
    longitude: number | null
    zoom?: number
  }
}) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup | null>(null)
  const onProvinceRef = useRef(onProvinceClick)
  const onCityRef = useRef(onCityClick)
  onProvinceRef.current = onProvinceClick
  onCityRef.current = onCityClick

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      attributionControl: true,
      zoomControl: true,
      maxBounds: IRAN_BOUNDS.pad(0.2),
      maxBoundsViscosity: 0.7,
      minZoom: 5,
      maxZoom: 12,
    }).fitBounds(IRAN_BOUNDS, { padding: [16, 16] })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    layersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const frame = window.requestAnimationFrame(() => map.invalidateSize())
    return () => {
      window.cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
      layersRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    layers.clearLayers()

    const max = Math.max(...provinces.map((item) => metricValue(item, metric)), 0)

    for (const province of provinces) {
      if (province.latitude == null || province.longitude == null) continue
      const value = metricValue(province, metric)
      const fill = heatColor(value, max)
      const provinceLabel = geoName(province, locale)
      const icon = L.divIcon({
        className: 'eskan-province-chip-wrap',
        iconSize: [118, 44],
        iconAnchor: [59, 22],
        html: `<button type="button" class="eskan-province-chip" style="background:${fill}">
          <span class="eskan-province-chip-name">${escapeHtml(provinceLabel)}</span>
          <span class="eskan-province-chip-value">${value > 0 ? escapeHtml(formatNumber(value, locale)) : '—'}</span>
        </button>`,
      })
      const marker = L.marker([province.latitude, province.longitude], {
        icon,
        zIndexOffset: 400,
      })
      marker.bindTooltip(
        `${provinceLabel}<br/>${t('provincialMonitoring.reservationPilgrims')}: ${formatNumber(province.reservationPilgrims.total, locale)}<br/>${t('provincialMonitoring.caravans')}: ${formatNumber(province.caravanCount, locale)}<br/>${t('provincialMonitoring.residentPilgrims')}: ${formatNumber(province.residentPilgrims, locale)}`,
        { direction: 'top', sticky: true },
      )
      marker.on('click', () => onProvinceRef.current(province.id))
      marker.addTo(layers)
    }

    if (showCities) {
      const cityMax = Math.max(
        ...cities.map((item) => metricValue(item, metric)),
        1,
      )
      for (const city of cities) {
        if (city.latitude == null || city.longitude == null) continue
        const value = metricValue(city, metric)
        if (value <= 0 && city.caravanCount <= 0 && city.residentPilgrims <= 0) continue
        const radius = 5 + Math.round((value / cityMax) * 10)
        const marker = L.circleMarker([city.latitude, city.longitude], {
          radius,
          color: '#148f8a',
          weight: 1,
          fillColor: '#2ebdb6',
          fillOpacity: 0.72,
        })
        const cityLabel = `${geoName(city, locale)} — ${geoName({ nameFa: city.provinceNameFa, nameEn: city.provinceNameEn }, locale)}`
        marker.bindTooltip(
          `${cityLabel}<br/>${t('provincialMonitoring.reservationPilgrims')}: ${formatNumber(city.reservationPilgrims.total, locale)}<br/>${t('provincialMonitoring.caravans')}: ${formatNumber(city.caravanCount, locale)}`,
          { direction: 'top', sticky: true },
        )
        marker.on('click', () => onCityRef.current(city.id))
        marker.addTo(layers)
      }
    }

    if (focus?.latitude != null && focus.longitude != null) {
      map.setView([focus.latitude, focus.longitude], focus.zoom ?? 8)
    } else {
      map.fitBounds(IRAN_BOUNDS, { padding: [16, 16] })
    }
    map.invalidateSize()
  }, [provinces, cities, metric, showCities, locale, t, focus])

  return (
    <div
      ref={containerRef}
      className="eskan-iran-map leaflet-container h-[420px] w-full sm:h-[560px]"
    />
  )
}
