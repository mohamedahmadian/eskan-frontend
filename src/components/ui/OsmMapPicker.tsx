import { LocateFixed, MapPinned } from 'lucide-react'
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

export type MapFocus = {
  lat: number
  lng: number
  zoom?: number
  bounds?: MapBounds
}

export type MapBounds = {
  south: number
  west: number
  north: number
  east: number
}

export type MapOverlayMarker = {
  id: string
  lat: number
  lng: number
  kind: 'previous' | 'current' | 'next' | 'history'
  badge: string
  title: string
  popupHtml?: string
}

export type MapOverlays = {
  markers: MapOverlayMarker[]
  path?: { lat: number; lng: number }[]
  fit?: boolean
}

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

function toLeafletBounds(bounds: MapBounds) {
  return L.latLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  )
}

export function OsmMapPicker({
  latitude,
  longitude,
  onChange,
  active = true,
  variant = 'collapsible',
  readOnly = false,
  autoGeolocate = false,
  showGeolocate = false,
  focus = null,
  maxBounds = null,
  heightClass = 'h-72',
  overlays = null,
  onGeolocate,
  onGeoError,
  onGeoOutside,
}: {
  latitude: string
  longitude: string
  onChange: (latitude: string, longitude: string) => void
  active?: boolean
  variant?: 'collapsible' | 'always'
  readOnly?: boolean
  autoGeolocate?: boolean
  showGeolocate?: boolean
  focus?: MapFocus | null
  maxBounds?: MapBounds | null
  heightClass?: string
  overlays?: MapOverlays | null
  onGeolocate?: (latitude: string, longitude: string) => void
  onGeoError?: () => void
  onGeoOutside?: () => void
}) {
  const { t } = useTranslation()
  const alwaysOpen = variant === 'always'
  const [open, setOpen] = useState(alwaysOpen)
  const [locating, setLocating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const overlayLayerRef = useRef<L.LayerGroup | null>(null)
  const onChangeRef = useRef(onChange)
  const onGeolocateRef = useRef(onGeolocate)
  const onGeoErrorRef = useRef(onGeoError)
  const onGeoOutsideRef = useRef(onGeoOutside)
  const maxBoundsRef = useRef(maxBounds)
  const autoGeoDoneRef = useRef(false)
  onChangeRef.current = onChange
  onGeolocateRef.current = onGeolocate
  onGeoErrorRef.current = onGeoError
  onGeoOutsideRef.current = onGeoOutside
  maxBoundsRef.current = maxBounds

  const canEdit = !readOnly
  const geolocateEnabled = showGeolocate || (alwaysOpen && !readOnly)

  function placeMarker(map: L.Map, latlng: L.LatLng, draggable: boolean) {
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng)
      if (markerRef.current.dragging) {
        if (draggable) markerRef.current.dragging.enable()
        else markerRef.current.dragging.disable()
      }
      return
    }
    markerRef.current = L.marker(latlng, { icon: pinIcon, draggable }).addTo(map)
    if (draggable) {
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng()
        if (!pos) return
        onChangeRef.current(formatCoord(pos.lat), formatCoord(pos.lng))
      })
    }
  }

  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return

    const start = parseLatLng(latitude, longitude)
    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: !readOnly,
    })
    if (start) {
      map.setView(start, 16)
    } else if (maxBounds) {
      map.fitBounds(toLeafletBounds(maxBounds), { padding: [28, 28], maxZoom: focus?.zoom ?? 13 })
    } else if (focus?.bounds) {
      map.fitBounds(toLeafletBounds(focus.bounds), { padding: [16, 16] })
    } else if (focus) {
      map.setView([focus.lat, focus.lng], focus.zoom ?? 9)
    } else {
      map.setView(MASHHAD, 13)
    }
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    if (start) placeMarker(map, start, canEdit)

    if (canEdit) {
      map.on('click', (event: L.LeafletMouseEvent) => {
        placeMarker(map, event.latlng, true)
        onChangeRef.current(formatCoord(event.latlng.lat), formatCoord(event.latlng.lng))
      })
    }

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
    placeMarker(map, next, canEdit)
    if ((!previous || previous.distanceTo(next) > 1) && !overlays?.fit) {
      map.setView(next, Math.max(map.getZoom(), 16))
    }
  }, [canEdit, latitude, longitude, open, overlays?.fit])

  useEffect(() => {
    const map = mapRef.current
    if (!open || !map) return
    if (overlays?.fit) {
      map.setMaxBounds(undefined as unknown as L.LatLngBounds)
      return
    }
    if (maxBounds) {
      const bounds = toLeafletBounds(maxBounds)
      map.setMaxBounds(bounds.pad(0.08))
      map.options.maxBoundsViscosity = 1
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: focus?.zoom ?? 13 })
      return
    }
    map.setMaxBounds(undefined as unknown as L.LatLngBounds)
    if (focus?.bounds) {
      map.fitBounds(toLeafletBounds(focus.bounds), { padding: [16, 16] })
    } else if (focus) {
      map.setView([focus.lat, focus.lng], focus.zoom ?? 9)
    }
  }, [focus, maxBounds, open, overlays?.fit])

  useEffect(() => {
    const map = mapRef.current
    if (!open || !map) return
    overlayLayerRef.current?.remove()
    overlayLayerRef.current = null
    if (!overlays?.markers.length && !overlays?.path?.length) return

    const layer = L.layerGroup().addTo(map)
    overlayLayerRef.current = layer
    if (overlays.path && overlays.path.length >= 2) {
      L.polyline(
        overlays.path.map((point) => [point.lat, point.lng] as L.LatLngTuple),
        {
          color: '#2EBDB6',
          weight: 4,
          opacity: 0.88,
          dashArray: '10 8',
          lineCap: 'round',
        },
      ).addTo(layer)
    }
    for (const marker of overlays.markers) {
      const isHistory = marker.kind === 'history'
      const icon = L.divIcon({
        className: `eskan-route-pin-wrap eskan-route-pin-${marker.kind}`,
        html: isHistory
          ? `<span class="eskan-history-pin">${marker.badge}</span>`
          : `<span class="eskan-route-pin"><span class="eskan-route-pin-badge">${marker.badge}</span><span class="eskan-route-pin-title">${marker.title}</span></span>`,
        iconSize: isHistory ? [28, 28] : [132, 52],
        iconAnchor: isHistory ? [14, 14] : [66, 50],
      })
      const pin = L.marker([marker.lat, marker.lng], {
        icon,
        zIndexOffset: marker.kind === 'current' ? 500 : isHistory ? 420 : 400,
        keyboard: false,
      }).addTo(layer)
      if (marker.popupHtml) {
        pin.bindPopup(marker.popupHtml, {
          className: 'eskan-route-popup',
          maxWidth: 280,
          autoClose: false,
        })
      }
    }
    if (overlays.fit) {
      const points = [
        ...overlays.markers.map((marker) => L.latLng(marker.lat, marker.lng)),
        ...((overlays.path ?? []).map((point) => L.latLng(point.lat, point.lng))),
      ]
      const here = parseLatLng(latitude, longitude)
      if (here) points.push(here)
      if (points.length) {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 12 })
      }
    }
    return () => {
      layer.remove()
      if (overlayLayerRef.current === layer) overlayLayerRef.current = null
    }
  }, [latitude, longitude, open, overlays])

  useEffect(() => {
    if (!open || !active || !mapRef.current) return
    const map = mapRef.current
    const timer = window.setTimeout(() => map.invalidateSize(), 50)
    return () => window.clearTimeout(timer)
  }, [open, active])

  function applyPosition(lat: number, lng: number, fromGeo: boolean) {
    const map = mapRef.current
    const latlng = L.latLng(lat, lng)
    const bounds = maxBoundsRef.current
    if (bounds && !toLeafletBounds(bounds).contains(latlng)) {
      return 'outside' as const
    }
    onChangeRef.current(formatCoord(lat), formatCoord(lng))
    if (fromGeo) onGeolocateRef.current?.(formatCoord(lat), formatCoord(lng))
    if (map) {
      placeMarker(map, latlng, canEdit)
      map.setView(latlng, Math.max(map.getZoom(), 16))
    }
    return 'ok' as const
  }

  function requestGeolocation(fromAuto: boolean) {
    if (!canEdit || typeof navigator === 'undefined' || !navigator.geolocation) {
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const result = applyPosition(position.coords.latitude, position.coords.longitude, true)
        if (result === 'outside' && !fromAuto) {
          onGeoOutsideRef.current?.()
        }
      },
      () => {
        setLocating(false)
        if (!fromAuto) {
          onGeoErrorRef.current?.()
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 20000 },
    )
  }

  useEffect(() => {
    if (!open || !autoGeolocate || !canEdit || autoGeoDoneRef.current) return
    if (parseLatLng(latitude, longitude)) {
      autoGeoDoneRef.current = true
      return
    }
    autoGeoDoneRef.current = true
    requestGeolocation(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGeolocate, canEdit, open])

  const showMapToggle = variant === 'collapsible'
  const showGeoButton = geolocateEnabled && open

  return (
    <div className={showMapToggle || showGeoButton ? 'space-y-3' : undefined}>
      {showMapToggle || showGeoButton ? (
        <div className="flex flex-wrap gap-2">
          {showMapToggle ? (
            <Button
              type="button"
              variant="soft"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              <MapPinned className="size-4" aria-hidden />
              {open ? t('accommodations.hideMap') : t('accommodations.pickFromMap')}
            </Button>
          ) : null}
          {showGeoButton ? (
            <Button
              type="button"
              variant="soft"
              disabled={locating}
              onClick={() => requestGeolocation(false)}
            >
              <LocateFixed className="size-4" aria-hidden />
              {locating ? t('location.locating') : t('location.useMyLocation')}
            </Button>
          ) : null}
        </div>
      ) : null}
      {open ? (
        <div dir="ltr" className="overflow-hidden rounded-2xl border border-line shadow-[0_8px_24px_rgba(20,40,40,0.06)]">
          <div ref={containerRef} className={`eskan-osm-map w-full ${heightClass}`} />
        </div>
      ) : null}
    </div>
  )
}
