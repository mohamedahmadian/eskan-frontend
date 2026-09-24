import { Footprints, LocateFixed, MapPinned } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { languageDir } from '../../i18n'
import { formatNumber } from '../../lib/datetime'
import {
  queryGeolocationPermission,
  requestBrowserGeolocation,
  type GeoErrorKind,
} from '../../lib/geolocation'
import { IMAM_REZA_SHRINE, distanceToShrine, formatShrineDistanceValue } from '../../lib/shrine'
import { Button } from './Form'

const pinIcon = L.divIcon({
  className: 'eskan-map-pin',
  html: '<span class="eskan-map-pin-dot"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const shrinePinIcon = L.divIcon({
  className: 'eskan-shrine-pin-wrap',
  html: '<span class="eskan-shrine-pin-dot"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function shrineLatLng() {
  return L.latLng(IMAM_REZA_SHRINE.latitude, IMAM_REZA_SHRINE.longitude)
}

function fitShrineDistance(map: L.Map, here: L.LatLng, relaxed = false) {
  const shrine = shrineLatLng()
  const maxZoom = relaxed ? 14 : 16
  if (here.distanceTo(shrine) < 40) {
    map.setView(here, maxZoom, { animate: false })
    return
  }
  map.fitBounds(L.latLngBounds([here, shrine]), {
    paddingTopLeft: relaxed ? [56, 88] : [40, 56],
    paddingBottomRight: relaxed ? [48, 48] : [28, 28],
    maxZoom,
    animate: false,
  })
}

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

const IRAN_BOUNDS: MapBounds = {
  south: 25.06,
  west: 44.03,
  north: 39.78,
  east: 63.33,
}

export type MapOverlayMarker = {
  id: string
  lat: number
  lng: number
  kind: 'previous' | 'current' | 'next' | 'history' | 'station' | 'destination'
  badge: string
  title: string
  popupHtml?: string
}

function overlayMarkerHtml(marker: MapOverlayMarker) {
  if (marker.kind === 'history') {
    return `<span class="eskan-history-pin">${marker.badge}</span>`
  }
  return `<span class="eskan-route-pin"><span class="eskan-route-pin-badge">${marker.badge}</span><span class="eskan-route-pin-title">${marker.title}</span></span>`
}

export type MapOverlayClickPoint = {
  x: number
  y: number
}

export type MapOverlays = {
  markers: MapOverlayMarker[]
  path?: { lat: number; lng: number }[]
  /** If set, `fit` zooms to these points instead of every marker and path vertex. */
  fitPoints?: { lat: number; lng: number }[]
  fit?: boolean
  fitMaxZoom?: number
}

function overlayLatLngs(overlays: MapOverlays | null, extra?: L.LatLng | null) {
  if (!overlays) return []
  const points = [
    ...overlays.markers.map((marker) => L.latLng(marker.lat, marker.lng)),
    ...(overlays.path ?? []).map((point) => L.latLng(point.lat, point.lng)),
  ]
  if (extra) points.push(extra)
  return points
}

function overlayFitLatLngs(overlays: MapOverlays | null, extra?: L.LatLng | null) {
  if (!overlays) return []
  if (overlays.fitPoints?.length) {
    const points = overlays.fitPoints.map((point) => L.latLng(point.lat, point.lng))
    if (extra) points.push(extra)
    return points
  }
  return overlayLatLngs(overlays, extra)
}

function overlayFitKey(points: L.LatLng[]) {
  return points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join('|')
}

function fitOverlayBounds(map: L.Map, overlays: MapOverlays | null, extra?: L.LatLng | null) {
  const points = overlayFitLatLngs(overlays, extra)
  if (!points.length) return
  const bounds = L.latLngBounds(points)
  if (!bounds.isValid()) return
  const maxZoom = overlays?.fitMaxZoom ?? 16
  if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
    map.setView(bounds.getCenter(), Math.min(maxZoom, 14))
    return
  }
  map.fitBounds(bounds, { padding: [56, 56], maxZoom })
}

function parseLatLng(latitude: string, longitude: string) {
  const latText = latitude.trim()
  const lngText = longitude.trim()
  if (!latText || !lngText) return null
  const lat = Number(latText)
  const lng = Number(lngText)
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
  zoom = 16,
  overlays = null,
  showShrineDistance = false,
  pointLabel,
  fill = false,
  keepInView = null,
  onMarkerClick,
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
  zoom?: number
  overlays?: MapOverlays | null
  /** خط و برچسب فاصلهٔ مستقیم و زمان پیاده‌روی تا حرم مطهر. */
  showShrineDistance?: boolean
  /** برچسب دائمی روی نقطهٔ موقعیت، مثل برچسب حرم. با این برچسب زوم کمی عقب‌تر می‌ماند. */
  pointLabel?: string
  fill?: boolean
  keepInView?: {
    id: string
    padding: { top: number; right: number; bottom: number; left: number }
  } | null
  onMarkerClick?: (id: string, point: MapOverlayClickPoint) => void
  onGeolocate?: (latitude: string, longitude: string) => void
  onGeoError?: (kind: GeoErrorKind) => void
  onGeoOutside?: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const alwaysOpen = variant === 'always'
  const [open, setOpen] = useState(alwaysOpen)
  const [locating, setLocating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const overlayLayerRef = useRef<L.LayerGroup | null>(null)
  const shrineLayerRef = useRef<L.LayerGroup | null>(null)
  const overlayFitKeyRef = useRef<string>('')
  const overlaysRef = useRef(overlays)
  const pointLabelRef = useRef(pointLabel)
  pointLabelRef.current = pointLabel
  const onChangeRef = useRef(onChange)
  const onGeolocateRef = useRef(onGeolocate)
  const onGeoErrorRef = useRef(onGeoError)
  const onGeoOutsideRef = useRef(onGeoOutside)
  const onMarkerClickRef = useRef(onMarkerClick)
  const maxBoundsRef = useRef(maxBounds)
  const autoGeoDoneRef = useRef(false)
  const stopGeoRef = useRef<(() => void) | null>(null)
  onChangeRef.current = onChange
  onGeolocateRef.current = onGeolocate
  onGeoErrorRef.current = onGeoError
  onGeoOutsideRef.current = onGeoOutside
  onMarkerClickRef.current = onMarkerClick
  overlaysRef.current = overlays
  maxBoundsRef.current = maxBounds

  const canEdit = !readOnly
  const geolocateEnabled = showGeolocate || (alwaysOpen && !readOnly)

  function bindPointLabel(marker: L.Marker) {
    marker.unbindTooltip()
    const label = pointLabelRef.current
    if (!label) return
    marker.bindTooltip(label, {
      permanent: true,
      direction: 'top',
      offset: [0, -10],
      className: 'eskan-shrine-tooltip',
    })
  }

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
    bindPointLabel(markerRef.current)
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
    const currentOverlays = overlaysRef.current
    if (start) {
      map.setView(start, zoom)
    } else if (currentOverlays?.fit && overlayFitLatLngs(currentOverlays).length) {
      fitOverlayBounds(map, currentOverlays)
    } else if (maxBounds) {
      map.fitBounds(toLeafletBounds(maxBounds), { padding: [28, 28], maxZoom: focus?.zoom ?? 13 })
    } else if (focus?.bounds) {
      map.fitBounds(toLeafletBounds(focus.bounds), { padding: [56, 56], maxZoom: focus.zoom ?? 16 })
    } else if (focus) {
      map.setView([focus.lat, focus.lng], focus.zoom ?? 9)
    } else {
      map.fitBounds(toLeafletBounds(IRAN_BOUNDS), { padding: [28, 28], maxZoom: 6 })
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
      shrineLayerRef.current = null
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
    if (
      (!previous || previous.distanceTo(next) > 1) &&
      !overlays?.fit &&
      !showShrineDistance
    ) {
      map.setView(next, Math.max(map.getZoom(), zoom))
    }
  }, [canEdit, latitude, longitude, open, overlays?.fit, showShrineDistance, zoom])

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
    if (!overlays?.markers.length && !overlays?.path?.length) {
      overlayFitKeyRef.current = ''
      return
    }

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
        html: overlayMarkerHtml(marker),
        iconSize: isHistory ? [28, 28] : [132, 52],
        iconAnchor: isHistory ? [14, 14] : [66, 50],
      })
      const pin = L.marker([marker.lat, marker.lng], {
        icon,
        zIndexOffset: marker.kind === 'current' ? 500 : isHistory ? 420 : 400,
        keyboard: false,
      }).addTo(layer)
      pin.on('click', (event: L.LeafletMouseEvent) => {
        const point = map.latLngToContainerPoint(event.latlng)
        onMarkerClickRef.current?.(marker.id, { x: point.x, y: point.y })
      })
      if (marker.popupHtml) {
        pin.bindPopup(marker.popupHtml, {
          className: 'eskan-route-popup',
          maxWidth: 280,
          autoClose: false,
        })
      }
    }
    if (overlays.fit) {
      const here = parseLatLng(latitude, longitude)
      const points = overlayFitLatLngs(overlays, here)
      const fitKey = overlayFitKey(points)
      if (points.length && overlayFitKeyRef.current !== fitKey) {
        overlayFitKeyRef.current = fitKey
        fitOverlayBounds(map, overlays, here)
      }
    } else {
      overlayFitKeyRef.current = ''
    }
    return () => {
      layer.remove()
      if (overlayLayerRef.current === layer) overlayLayerRef.current = null
    }
  }, [latitude, longitude, open, overlays])

  useEffect(() => {
    const map = mapRef.current
    shrineLayerRef.current?.remove()
    shrineLayerRef.current = null
    if (!open || !map || !showShrineDistance) return
    const here = parseLatLng(latitude, longitude)
    if (!here) return

    const shrine = shrineLatLng()
    const layer = L.layerGroup().addTo(map)
    shrineLayerRef.current = layer
    if (here.distanceTo(shrine) >= 8) {
      L.polyline([here, shrine], {
        color: '#2EBDB6',
        weight: 3,
        opacity: 0.9,
        dashArray: '7 7',
        lineCap: 'round',
        interactive: false,
      }).addTo(layer)
    }
    const pin = L.marker(shrine, {
      icon: shrinePinIcon,
      interactive: false,
      keyboard: false,
      zIndexOffset: 600,
    }).addTo(layer)
    pin.bindTooltip(t('shrine.mapLabel'), {
      permanent: true,
      direction: 'top',
      offset: [0, -8],
      className: 'eskan-shrine-tooltip',
    })
    if (markerRef.current) bindPointLabel(markerRef.current)
    fitShrineDistance(map, here, Boolean(pointLabel))

    return () => {
      layer.remove()
      if (shrineLayerRef.current === layer) shrineLayerRef.current = null
    }
  }, [latitude, longitude, open, pointLabel, showShrineDistance, t])

  useEffect(() => {
    if (!open || !active || !mapRef.current) return
    const map = mapRef.current
    function resizeAndFit() {
      map.invalidateSize()
      if (showShrineDistance) {
        const here = parseLatLng(latitude, longitude)
        if (here) fitShrineDistance(map, here, Boolean(pointLabel))
        return
      }
      const current = overlaysRef.current
      if (!current?.fit) return
      const here = parseLatLng(latitude, longitude)
      overlayFitKeyRef.current = overlayFitKey(overlayFitLatLngs(current, here))
      fitOverlayBounds(map, current, here)
    }
    const first = window.setTimeout(resizeAndFit, 50)
    const second = window.setTimeout(resizeAndFit, 220)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
    }
  }, [active, latitude, longitude, open, pointLabel, showShrineDistance])

  useEffect(() => {
    const map = mapRef.current
    if (!open || !map || !keepInView) return
    const marker = overlaysRef.current?.markers.find((item) => item.id === keepInView.id)
    if (!marker) return
    const timer = window.setTimeout(() => {
      map.panInside(L.latLng(marker.lat, marker.lng), {
        paddingTopLeft: [keepInView.padding.left, keepInView.padding.top],
        paddingBottomRight: [keepInView.padding.right, keepInView.padding.bottom],
        animate: true,
      })
    }, 40)
    return () => window.clearTimeout(timer)
  }, [keepInView, open])

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
    if (!canEdit) return
    stopGeoRef.current?.()
    setLocating(true)
    let applied = false
    let lastOutside = false

    stopGeoRef.current = requestBrowserGeolocation({
      onPosition(coords) {
        const result = applyPosition(coords.latitude, coords.longitude, !applied)
        if (result === 'ok') {
          applied = true
          lastOutside = false
          setLocating(false)
          return
        }
        lastOutside = true
      },
      onError(kind) {
        if (fromAuto) return
        onGeoErrorRef.current?.(kind)
      },
      onSettled(reason) {
        stopGeoRef.current = null
        setLocating(false)
        if (reason === 'cancel' || fromAuto || applied) return
        if (lastOutside) onGeoOutsideRef.current?.()
      },
    })
  }

  useEffect(() => {
    return () => {
      stopGeoRef.current?.()
      stopGeoRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open || !autoGeolocate || !canEdit || autoGeoDoneRef.current) return
    if (parseLatLng(latitude, longitude)) {
      autoGeoDoneRef.current = true
      return
    }
    autoGeoDoneRef.current = true
    let cancelled = false
    void queryGeolocationPermission().then((state) => {
      if (cancelled || state !== 'granted') return
      requestGeolocation(true)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGeolocate, canEdit, open])

  const showMapToggle = variant === 'collapsible'
  const showGeoButton = geolocateEnabled && open
  const shrinePoint = showShrineDistance ? parseLatLng(latitude, longitude) : null
  const shrineStats = shrinePoint
    ? distanceToShrine(shrinePoint.lat, shrinePoint.lng)
    : null
  const shrineDistanceParts = shrineStats
    ? formatShrineDistanceValue(shrineStats.km, locale)
    : null
  const shrineDistanceLabel = shrineDistanceParts
    ? t(
        shrineDistanceParts.unit === 'm' ? 'shrine.distanceMeters' : 'shrine.distanceKm',
        { value: shrineDistanceParts.value },
      )
    : null
  const shrineWalkLabel = shrineStats
    ? shrineStats.walkMinutes < 1
      ? t('shrine.walkUnderMinute')
      : shrineStats.walkMinutes < 60
        ? t('shrine.walkMinutes', {
            value: formatNumber(shrineStats.walkMinutes, locale),
          })
        : shrineStats.walkMinutes % 60 === 0
          ? t('shrine.walkHours', {
              value: formatNumber(Math.floor(shrineStats.walkMinutes / 60), locale),
            })
          : t('shrine.walkHoursMinutes', {
              hours: formatNumber(Math.floor(shrineStats.walkMinutes / 60), locale),
              minutes: formatNumber(shrineStats.walkMinutes % 60, locale),
            })
    : null

  return (
    <div
      className={
        showMapToggle || showGeoButton ? 'space-y-3' : fill ? 'h-full min-h-0' : undefined
      }
    >
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
        <div
          dir="ltr"
          className={`relative overflow-hidden rounded-2xl border border-line shadow-[0_8px_24px_rgba(20,40,40,0.06)] ${
            fill ? 'h-full' : ''
          }`}
        >
          <div
            ref={containerRef}
            className={`eskan-osm-map w-full ${fill ? 'h-full' : heightClass}`}
          />
          {shrineDistanceLabel && shrineWalkLabel ? (
            <div className="pointer-events-none absolute inset-x-2 top-2 z-[450] flex justify-center sm:inset-x-8">
              <p
                dir={languageDir(locale)}
                className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-2xl bg-white/95 px-3 py-1.5 text-[11px] font-semibold leading-5 text-ink-800 shadow-[0_6px_16px_rgba(20,40,40,0.12)] ring-1 ring-teal-100"
              >
                <MapPinned className="size-3.5 shrink-0 text-mint-500" aria-hidden />
                <span>{t('shrine.mapLabel')}</span>
                <span className="text-ink-300" aria-hidden>
                  ·
                </span>
                <span>{shrineDistanceLabel}</span>
                <span className="text-ink-300" aria-hidden>
                  ·
                </span>
                <Footprints className="size-3.5 shrink-0 text-teal-600" aria-hidden />
                <span>{shrineWalkLabel}</span>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
