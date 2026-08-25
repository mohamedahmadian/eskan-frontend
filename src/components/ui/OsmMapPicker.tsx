import { MapPinned } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from './Form'

const MASHHAD: L.LatLngTuple = [36.2878, 59.6154]
const pinIcon = L.divIcon({
  className: 'eskan-map-pin',
  html: '<span class="eskan-map-pin-dot"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function parseLatLng(latitude: string, longitude: string) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return L.latLng(lat, lng)
}

function formatCoord(value: number) {
  return String(Number(value.toFixed(6)))
}

export function OsmMapPicker({
  latitude,
  longitude,
  onChange,
  active = true,
}: {
  latitude: string
  longitude: string
  onChange: (latitude: string, longitude: string) => void
  active?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return

    const start = parseLatLng(latitude, longitude)
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
      start ?? MASHHAD,
      start ? 16 : 13,
    )
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    function placeMarker(latlng: L.LatLng) {
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng)
        return
      }
      markerRef.current = L.marker(latlng, { icon: pinIcon, draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng()
        if (!pos) return
        onChangeRef.current(formatCoord(pos.lat), formatCoord(pos.lng))
      })
    }

    if (start) placeMarker(start)

    map.on('click', (event: L.LeafletMouseEvent) => {
      placeMarker(event.latlng)
      onChangeRef.current(formatCoord(event.latlng.lat), formatCoord(event.latlng.lng))
    })

    mapRef.current = map
    const frame = window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      window.cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Map is created once per open session; lat/lng sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const map = mapRef.current
    if (!open || !map) return
    const next = parseLatLng(latitude, longitude)
    if (!next) return
    const previous = markerRef.current?.getLatLng()
    if (markerRef.current) {
      markerRef.current.setLatLng(next)
    } else {
      markerRef.current = L.marker(next, { icon: pinIcon, draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng()
        if (!pos) return
        onChangeRef.current(formatCoord(pos.lat), formatCoord(pos.lng))
      })
    }
    if (!previous || previous.distanceTo(next) > 1) {
      map.setView(next, Math.max(map.getZoom(), 16))
    }
  }, [latitude, longitude, open])

  useEffect(() => {
    if (!open || !active || !mapRef.current) return
    const map = mapRef.current
    const timer = window.setTimeout(() => map.invalidateSize(), 50)
    return () => window.clearTimeout(timer)
  }, [open, active])

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="soft"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MapPinned className="size-4" aria-hidden />
        {open ? t('accommodations.hideMap') : t('accommodations.pickFromMap')}
      </Button>
      {open ? (
        <div dir="ltr" className="overflow-hidden rounded-2xl border border-line">
          <div ref={containerRef} className="eskan-osm-map h-72 w-full" />
        </div>
      ) : null}
    </div>
  )
}
