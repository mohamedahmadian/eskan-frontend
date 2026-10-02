import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Clock3,
  Landmark,
  MapPin,
  Mars,
  Phone,
  Route,
  Save,
  Sparkles,
  Square,
  Tent,
  UserRound,
  Venus,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import { Button, fieldClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { OsmMapPicker, type MapOverlayLine, type MapOverlayMarker } from '../../components/ui/OsmMapPicker'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, localizeDigits } from '../../lib/datetime'
import { geoName, haversineKm } from '../../lib/geo'
import { IMAM_REZA_SHRINE, formatShrineDistanceValue } from '../../lib/shrine'

type SolverGender = 'men' | 'women'
type SolverPlaceType = 'SCHOOL' | 'MOSQUE' | 'HUSSEINIEH' | 'HALL' | 'HOUSE' | 'OTHER'

type SolverCaravan = {
  id: string
  caravanId: string | null
  label: string
  code: string
  name: string
  managerName: string | null
  managerUserId: string | null
  managerPhone: string | null
  men: number
  women: number
  originCityId: string | null
  originCityNameFa: string | null
  originCityNameEn: string | null
  walkingRouteId: string | null
  walkingRouteName: string | null
}

type SolverAccommodation = {
  id: string
  name: string
  type: SolverGender
  placeType: SolverPlaceType
  capacity: number
  latitude: number
  longitude: number
  managerName: string | null
  managerUserId: string | null
  managerPhone: string | null
  address: string | null
}

type SolverBoard = {
  year: number
  caravanCount: number
  activeCaravanCount: number
  yearCaravanCount: number
  accommodationCount: number
  skippedWithoutLocation: number
  caravans: SolverCaravan[]
  accommodations: SolverAccommodation[]
}

type SolverAssignment = {
  groupId: string
  gender: SolverGender
  placeId: string
}

type SolverStatus = {
  phase: 'idle' | 'running' | 'done' | 'infeasible' | 'failed' | 'stopped'
  year: number | null
  startedAt: string | null
  elapsedSeconds: number
  timeLimitSeconds: number | null
  solutionCount: number
  solverStatus: 'OPTIMAL' | 'FEASIBLE' | null
  error: string | null
  assignments: SolverAssignment[]
}

const shrineFocus = {
  lat: IMAM_REZA_SHRINE.latitude,
  lng: IMAM_REZA_SHRINE.longitude,
  zoom: 13,
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function svgIcon(body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}

const placeTypeIcons: Record<SolverPlaceType, string> = {
  SCHOOL: svgIcon(
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  ),
  MOSQUE: svgIcon(
    '<path d="M4 22h16"/><path d="M6 22V11"/><path d="M18 22V11"/><path d="M6 11a6 6 0 0 1 12 0"/><path d="M12 5V2"/><path d="M10.5 2h3"/>',
  ),
  HUSSEINIEH: svgIcon(
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  ),
  HALL: svgIcon(
    '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/>',
  ),
  HOUSE: svgIcon(
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  ),
  OTHER: svgIcon(
    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  ),
}

const managerIcon = svgIcon('<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>')
const pinIcon = svgIcon(
  '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
)
const phoneIcon = svgIcon(
  '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
)
function detailLink(href: string | null | undefined, label: string) {
  const text = escapeHtml(label)
  if (!href) return text
  return `<a class="eskan-venue-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`
}

function popupFact(
  icon: string,
  label: string,
  value: string,
  options?: { valueDir?: 'ltr'; href?: string | null; trailingHtml?: string; wrap?: boolean },
) {
  const dir = options?.valueDir ? ` dir="${options.valueDir}"` : ''
  const row = options?.trailingHtml ? ' eskan-venue-popup-value-row' : ''
  const ltr = options?.valueDir === 'ltr' ? ' eskan-venue-popup-value-ltr' : ''
  const wrap = options?.wrap ? ' eskan-venue-popup-value-wrap' : ''
  const trailing = options?.trailingHtml ?? ''
  return `<div class="eskan-venue-popup-tile"><span class="eskan-venue-popup-ico">${icon}</span><span class="eskan-venue-popup-tile-body"><span class="eskan-venue-popup-label">${escapeHtml(label)}</span><span class="eskan-venue-popup-value${row}${ltr}${wrap}"${dir}>${detailLink(options?.href, value)}${trailing}</span></span></div>`
}

function popupStat(label: string, valueHtml: string) {
  return `<div class="eskan-venue-popup-stat"><span class="k">${escapeHtml(label)}</span><span class="v">${valueHtml}</span></div>`
}

function popupPair(left: string, right: string) {
  return `<div class="eskan-venue-popup-pair">${left}${right}</div>`
}

function clock(totalSeconds: number, locale: string) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  const text =
    hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`
  return localizeDigits(text, locale)
}

export function PlacementSystemPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = useCallback((value: number) => formatNumber(value, locale), [locale])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const year = Number(searchParams.get('year')) || currentPersianYear()
  const [minutes, setMinutes] = useState('30')
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [saving, setSaving] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [caravanFilter, setCaravanFilter] = useState('')
  const [filterMap, setFilterMap] = useState(false)
  const [pinnedPlaceId, setPinnedPlaceId] = useState<string | null>(null)

  const board = useQuery({
    queryKey: ['placements', 'system', 'board', year],
    queryFn: async () => {
      const { data } = await api.get<SolverBoard>('/placements/system/board', { params: { year } })
      return data
    },
  })

  const status = useQuery({
    queryKey: ['placements', 'system', 'status'],
    queryFn: async () => {
      const { data } = await api.get<SolverStatus>('/placements/system/status')
      return data
    },
    refetchInterval: (query) => (query.state.data?.phase === 'running' ? 30_000 : false),
  })

  const running = status.data?.phase === 'running'
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (document.querySelector('.leaflet-popup')) return
      navigate('/placements')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const elapsedSeconds =
    running && status.data?.startedAt
      ? Math.max(0, Math.floor((now - Date.parse(status.data.startedAt)) / 1000))
      : (status.data?.elapsedSeconds ?? 0)

  const caravans = board.data?.caravans ?? []
  const accommodations = board.data?.accommodations ?? []
  const assignments = status.data?.assignments ?? []
  const caravanOptions = useMemo(
    () =>
      [...caravans]
        .sort((a, b) => a.name.localeCompare(b.name, locale))
        .map((item) => ({
          value: item.id,
          label: item.code ? `${item.name} (${localizeDigits(item.code, locale)})` : item.name,
        })),
    [caravans, locale],
  )
  const filteredPlaceIds = useMemo(() => {
    if (!filterMap || !caravanFilter) return null
    return new Set(
      assignments.filter((row) => row.groupId === caravanFilter).map((row) => row.placeId),
    )
  }, [assignments, caravanFilter, filterMap])

  useEffect(() => {
    if (caravanFilter && !caravans.some((item) => item.id === caravanFilter)) {
      setCaravanFilter('')
    }
  }, [caravans, caravanFilter])

  const overlays = useMemo(() => {
    const byId = new Map(caravans.map((item) => [item.id, item]))
    const byPlace = new Map<string, { caravan: SolverCaravan; gender: SolverGender; count: number }[]>()
    for (const row of assignments) {
      const caravan = byId.get(row.groupId)
      if (!caravan) continue
      const count = row.gender === 'men' ? caravan.men : caravan.women
      const list = byPlace.get(row.placeId) ?? []
      list.push({ caravan, gender: row.gender, count })
      byPlace.set(row.placeId, list)
    }
    const markers: MapOverlayMarker[] = accommodations.flatMap((place) => {
      if (filteredPlaceIds && !filteredPlaceIds.has(place.id)) return []
      const rows = (byPlace.get(place.id) ?? []).filter(
        (row) => !caravanFilter || row.caravan.id === caravanFilter,
      )
      const genderLabel = t(place.type === 'men' ? 'placements.systemMen' : 'placements.systemWomen')
      const placeType = place.placeType && place.placeType in placeTypeIcons ? place.placeType : 'OTHER'
      const icon = placeTypeIcons[placeType]
      const typeLabel = t(`accommodationTypes.${placeType}`)
      const missing = t('placements.systemNotSet')
      const managerName = place.managerName?.trim() || missing
      const managerPhone = place.managerPhone?.trim()
        ? localizeDigits(place.managerPhone.trim(), locale)
        : missing
      const address = place.address?.trim() || missing
      const assigned = rows.reduce((sum, row) => sum + row.count, 0)
      const remaining = place.capacity - assigned
      const people = (count: number) => escapeHtml(t('placements.systemPeople', { count: n(count) }))
      const genderBadge = `<span class="eskan-venue-gender-badge${place.type === 'women' ? ' is-women' : ''}">${escapeHtml(genderLabel)}</span>`
      const placeHref = `/accommodations/${place.id}`
      const placeManagerHref =
        place.managerUserId && managerName !== missing ? `/users/${place.managerUserId}` : null
      return [
        {
          id: place.id,
          lat: place.latitude,
          lng: place.longitude,
          kind: 'venue' as const,
          tone: place.type,
          badge: rows.length ? n(rows.length) : '',
          title: place.name,
          iconSvg: icon,
          popupHtml: `<div class="eskan-venue-popup-body${place.type === 'women' ? ' is-women' : ''}" dir="rtl"><div class="eskan-venue-popup-head"><span class="eskan-venue-popup-mark">${icon}</span><div><strong>${detailLink(placeHref, place.name)}</strong><span class="eskan-venue-popup-meta">${escapeHtml(typeLabel)}</span></div></div><div class="eskan-venue-popup-facts">${popupPair(popupStat(t('placements.systemCaravanCount'), escapeHtml(n(rows.length))), popupStat(t('placements.systemCurrentCapacity'), `${people(place.capacity)}${genderBadge}`))}${popupPair(popupStat(t('placements.systemAssignedCapacity'), people(assigned)), popupStat(t('placements.systemRemainingCapacity'), people(remaining)))}${popupFact(managerIcon, t('placements.systemManager'), managerName, { href: placeManagerHref })}${popupFact(phoneIcon, t('placements.systemManagerPhone'), managerPhone, place.managerPhone?.trim() ? { valueDir: 'ltr' } : undefined)}${popupFact(pinIcon, t('placements.systemAddress'), address, { wrap: true })}</div></div>`,
        },
      ]
    })
    return { markers }
  }, [accommodations, assignments, caravanFilter, caravans, filteredPlaceIds, locale, n, t])

  const pinnedCaravanIds = useMemo(() => {
    if (!pinnedPlaceId) return []
    return [
      ...new Set(
        assignments.filter((row) => row.placeId === pinnedPlaceId).map((row) => row.groupId),
      ),
    ]
  }, [assignments, pinnedPlaceId])

  const linkLines = useMemo(() => {
    const caravanIds = pinnedPlaceId ? pinnedCaravanIds : caravanFilter ? [caravanFilter] : []
    if (!caravanIds.length) return [] as MapOverlayLine[]
    const shrine = { lat: IMAM_REZA_SHRINE.latitude, lng: IMAM_REZA_SHRINE.longitude }
    const distanceLabel = (lat: number, lng: number, lat2: number, lng2: number) => {
      const km = haversineKm(lat, lng, lat2, lng2)
      const parts = formatShrineDistanceValue(km, locale)
      return t(parts.unit === 'm' ? 'shrine.distanceMeters' : 'shrine.distanceKm', { value: parts.value })
    }
    const lines: MapOverlayLine[] = []
    const seen = new Set<string>()
    const push = (line: MapOverlayLine) => {
      const key = `${line.from.lat},${line.from.lng}:${line.to.lat},${line.to.lng}`
      if (seen.has(key)) return
      seen.add(key)
      lines.push(line)
    }
    for (const caravanId of caravanIds) {
      const rows = assignments.filter((row) => row.groupId === caravanId)
      const men = accommodations.find((place) => place.id === rows.find((row) => row.gender === 'men')?.placeId)
      const women = accommodations.find(
        (place) => place.id === rows.find((row) => row.gender === 'women')?.placeId,
      )
      if (men) {
        push({
          id: `${caravanId}:shrine-men`,
          from: { lat: men.latitude, lng: men.longitude },
          to: shrine,
          color: '#2ebdb6',
          dashed: true,
          label: distanceLabel(men.latitude, men.longitude, shrine.lat, shrine.lng),
        })
      }
      if (women) {
        push({
          id: `${caravanId}:shrine-women`,
          from: { lat: women.latitude, lng: women.longitude },
          to: shrine,
          color: '#db2777',
          dashed: true,
          label: distanceLabel(women.latitude, women.longitude, shrine.lat, shrine.lng),
        })
      }
      if (men && women && men.id !== women.id) {
        push({
          id: `${caravanId}:pair`,
          from: { lat: men.latitude, lng: men.longitude },
          to: { lat: women.latitude, lng: women.longitude },
          color: '#3f3a34',
          label: distanceLabel(men.latitude, men.longitude, women.latitude, women.longitude),
        })
      }
    }
    return lines
  }, [accommodations, assignments, caravanFilter, locale, pinnedCaravanIds, t])

  const mapOverlays = useMemo(
    () => ({
      markers: overlays.markers,
      lines: linkLines,
      fit: linkLines.length > 0,
      openMarkerId: pinnedPlaceId,
    }),
    [linkLines, overlays.markers, pinnedPlaceId],
  )

  const selectedCaravan = caravanFilter
    ? (caravans.find((item) => item.id === caravanFilter) ?? null)
    : null
  const menShrine = linkLines.find((line) => line.id === `${caravanFilter}:shrine-men`)?.label
  const womenShrine = linkLines.find((line) => line.id === `${caravanFilter}:shrine-women`)?.label
  const pairDistance = linkLines.find((line) => line.id === `${caravanFilter}:pair`)?.label

  function selectCaravan(caravanId: string) {
    setPinnedPlaceId(null)
    setFilterMap(true)
    setCaravanFilter(caravanId)
  }

  function clearCaravanFocus() {
    setPinnedPlaceId(null)
    setFilterMap(false)
    setCaravanFilter('')
  }

  function onPlaceClick(placeId: string) {
    setFilterMap(false)
    setCaravanFilter('')
    setPinnedPlaceId(placeId)
  }

  const phaseLabel = (() => {
    const phase = status.data?.phase
    if (phase === 'running') return t('placements.systemRunning')
    if (phase === 'done' && status.data?.solverStatus === 'OPTIMAL') return t('placements.systemDoneOptimal')
    if (phase === 'done') return t('placements.systemDoneFeasible')
    if (phase === 'infeasible') return t('placements.systemInfeasible')
    if (phase === 'failed') return status.data?.error || t('placements.systemFailed')
    if (phase === 'stopped') return t('placements.systemStopped')
    return t('placements.systemIdle')
  })()

  const unassigned = useMemo(() => {
    if (
      !assignments.length &&
      status.data?.phase !== 'done' &&
      status.data?.phase !== 'infeasible' &&
      status.data?.phase !== 'stopped'
    ) {
      return 0
    }
    const placed = new Set(assignments.map((row) => `${row.groupId}:${row.gender}`))
    let missing = 0
    for (const caravan of caravans) {
      if (caravan.men > 0 && !placed.has(`${caravan.id}:men`)) missing += 1
      if (caravan.women > 0 && !placed.has(`${caravan.id}:women`)) missing += 1
    }
    return missing
  }, [assignments, caravans, status.data?.phase])

  function start() {
    const limit = Number(minutes)
    if (!Number.isFinite(limit) || limit < 1 || limit > 120) {
      toast.error(t('placements.systemLimitInvalid'))
      return
    }
    if (assignments.length > 0) {
      confirmToast({
        title: t('placements.systemStartConfirm'),
        confirmLabel: t('common.yes'),
        cancelLabel: t('common.cancel'),
        onConfirm: () => {
          void runStart(limit)
        },
      })
      return
    }
    void runStart(limit)
  }

  async function runStart(limit: number) {
    setStarting(true)
    await queryClient.cancelQueries({ queryKey: ['placements', 'system', 'status'] })
    queryClient.setQueryData<SolverStatus>(['placements', 'system', 'status'], (current) => ({
      phase: 'running',
      year: current?.year ?? year,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      timeLimitSeconds: Math.round(limit * 60),
      solutionCount: 0,
      solverStatus: null,
      error: null,
      assignments: [],
    }))
    try {
      await api.post('/placements/system/start', {
        year,
        timeLimitSeconds: Math.round(limit * 60),
      })
      await queryClient.invalidateQueries({ queryKey: ['placements', 'system', 'status'] })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      await queryClient.invalidateQueries({ queryKey: ['placements', 'system', 'status'] })
    } finally {
      setStarting(false)
    }
  }

  async function stop() {
    setStopping(true)
    try {
      await api.post('/placements/system/stop')
      toast.success(t('placements.systemStopped'))
      await queryClient.invalidateQueries({ queryKey: ['placements', 'system', 'status'] })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setStopping(false)
    }
  }

  function save() {
    confirmToast({
      title: t('placements.systemSaveConfirm'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        setSaving(true)
        try {
          const { data } = await api.post<{ saved: number }>('/placements/system/save')
          toast.success(t('placements.systemSaved', { count: n(data.saved) }))
          await queryClient.invalidateQueries({ queryKey: ['placements'] })
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const limitValue =
    running && status.data?.timeLimitSeconds
      ? String(Math.round(status.data.timeLimitSeconds / 60))
      : minutes
  const canStart = !running && !starting && caravans.length > 0 && accommodations.length > 0
  const canSave =
    !running &&
    (status.data?.phase === 'done' || status.data?.phase === 'stopped') &&
    assignments.length > 0

  const screen = (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream-50">
      <header className="relative border-b border-teal-100 bg-white/95 shadow-sm">
        {running ? (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-center px-4">
            <p className="eskan-solver-live pointer-events-auto inline-flex max-w-[min(100%,42rem)] items-center justify-center gap-2 rounded-full bg-white px-4 py-1.5 text-center text-sm font-semibold text-teal-800">
              <span className="eskan-solver-live-dot size-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
              <span className="text-center">
                {t('placements.systemPlacing', {
                  caravans: n(board.data?.caravanCount ?? caravans.length),
                  places: n(accommodations.length),
                })}
              </span>
            </p>
          </div>
        ) : null}
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto px-4 py-3">
        <button
          type="button"
          className="cursor-pointer rounded-xl p-2 text-ink-700 hover:bg-teal-50"
          onClick={() => navigate('/placements')}
          aria-label={t('placements.systemBack')}
        >
          <ArrowRight className="size-5 ltr:rotate-180" aria-hidden />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-ink-900">{t('placements.systemTitle')}</h1>
          {running ? null : <p className="text-xs text-ink-500">{phaseLabel}</p>}
        </div>
        <div className="flex flex-nowrap items-center gap-2">
          <Stat
            icon={Tent}
            label={t('placements.systemYearCaravans')}
            value={n(board.data?.yearCaravanCount ?? 0)}
          />
          {(board.data?.activeCaravanCount ?? 0) !== (board.data?.yearCaravanCount ?? 0) ? (
            <Stat
              icon={Tent}
              label={t('placements.systemActiveCaravans')}
              value={n(board.data?.activeCaravanCount ?? 0)}
            />
          ) : null}
          <Stat
            icon={Building2}
            label={t('placements.systemAccommodations')}
            value={n(board.data?.accommodationCount ?? 0)}
          />
          {accommodations.length !== (board.data?.accommodationCount ?? 0) ? (
            <Stat icon={MapPin} label={t('placements.systemOnMap')} value={n(accommodations.length)} />
          ) : null}
          {status.data?.solutionCount ? (
            <Stat
              icon={Sparkles}
              label={t('placements.systemCheckpoint')}
              value={n(status.data.solutionCount)}
            />
          ) : null}
          {unassigned > 0 ? (
            <span className="rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
              {t('placements.systemUnassigned', { count: n(unassigned) })}
            </span>
          ) : null}
        </div>
        <div className="ms-auto flex flex-nowrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-cream-50 px-3 py-2 text-sm font-semibold text-ink-800">
            <Clock3 className="size-4 text-teal-600" aria-hidden />
            <span dir="ltr">{clock(elapsedSeconds, locale)}</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-600" htmlFor="placement-solver-minutes">
            {t('placements.systemLimit')}
            <input
              id="placement-solver-minutes"
              type="number"
              min={1}
              max={120}
              value={limitValue}
              disabled={running}
              onChange={(event) => setMinutes(event.target.value)}
              className={`${fieldClassName} digit-field !w-20`}
            />
          </label>
          {running ? (
            <Button type="button" variant="danger" onClick={() => void stop()} disabled={stopping}>
              <Square className="size-4" aria-hidden />
              {t('placements.systemStop')}
            </Button>
          ) : null}
          {canSave ? (
            <Button type="button" onClick={save} disabled={saving}>
              <Save className="size-4" aria-hidden />
              {t('placements.systemSave')}
            </Button>
          ) : null}
          <Button type="button" onClick={() => void start()} disabled={!canStart}>
            <Sparkles className="size-4" aria-hidden />
            {running ? t('placements.systemRunning') : t('placements.systemStart')}
          </Button>
        </div>
        </div>
      </header>
      {board.data?.skippedWithoutLocation ? (
        <p className="px-4 pt-2 text-xs text-ink-500">
          {t('placements.systemSkippedLocation', { count: n(board.data.skippedWithoutLocation) })}
        </p>
      ) : null}
      {!board.isLoading && caravans.length === 0 ? (
        <p className="px-4 pt-2 text-sm text-ink-600">{t('placements.systemNoCaravans')}</p>
      ) : null}
      {!board.isLoading && caravans.length > 0 && accommodations.length === 0 ? (
        <p className="px-4 pt-2 text-sm text-ink-600">{t('placements.systemNoPlaces')}</p>
      ) : null}
      <div className="relative min-h-0 flex-1 p-3">
        <div className="pointer-events-auto absolute top-4 start-4 z-[500] flex max-h-[calc(100%-2rem)] w-[26rem] max-w-[calc(100%-2rem)] flex-col gap-2 overflow-y-auto rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-teal-100">
          <SearchSelect
            id="placement-caravan-filter"
            value={caravanFilter}
            onChange={selectCaravan}
            options={caravanOptions}
            placeholder={t('placements.systemCaravanSearch')}
          />
          {selectedCaravan ? (
            <CaravanInfoCard
              caravan={selectedCaravan}
              locale={locale}
              menPlace={placedStay(selectedCaravan.id, 'men', assignments, accommodations)}
              womenPlace={placedStay(selectedCaravan.id, 'women', assignments, accommodations)}
              menDistance={menShrine}
              womenDistance={womenShrine}
              pairDistance={pairDistance}
            />
          ) : null}
          {!selectedCaravan && pinnedCaravanIds.length ? (
            <CaravanIndexTabs
              key={pinnedPlaceId ?? 'place'}
              locale={locale}
              caravans={pinnedCaravanIds.flatMap((id) => {
                const caravan = caravans.find((item) => item.id === id)
                return caravan ? [caravan] : []
              })}
              stay={(id, gender) => placedStay(id, gender, assignments, accommodations)}
              distance={(id, kind) => linkLines.find((line) => line.id === `${id}:${kind}`)?.label}
            />
          ) : null}
          {caravanFilter || pinnedPlaceId ? (
            <Button type="button" variant="ghost" className="w-full" onClick={clearCaravanFocus}>
              <X className="size-4" aria-hidden />
              {t('placements.systemClearCaravan')}
            </Button>
          ) : null}
          {caravanFilter && filteredPlaceIds?.size === 0 ? (
            <p className="text-xs text-ink-500">{t('placements.systemCaravanFilterEmpty')}</p>
          ) : null}
        </div>
        <OsmMapPicker
          latitude=""
          longitude=""
          onChange={() => undefined}
          readOnly
          variant="always"
          fill
          focus={shrineFocus}
          showShrinePin
          onMarkerClick={onPlaceClick}
          overlays={mapOverlays}
          heightClass="h-full"
        />
        <div className="pointer-events-none absolute bottom-6 start-6 z-[500] flex flex-col gap-1.5 rounded-2xl bg-white/95 px-3 py-2 text-xs font-medium text-ink-700 shadow-sm ring-1 ring-teal-100">
          <LegendDot className="bg-teal-500" label={t('placements.systemMen')} />
          <LegendDot className="bg-[#db2777]" label={t('placements.systemWomen')} />
          <span className="inline-flex items-center gap-2">
            <img src="/reza.png" alt="" className="size-7 object-contain" />
            {t('shrine.mapLabel')}
          </span>
        </div>
      </div>
    </div>
  )

  return createPortal(screen, document.body)
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tent
  label: string
  value: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl bg-cream-50 px-3 py-1.5 text-xs text-ink-600">
      <Icon className="size-3.5 text-teal-600" aria-hidden />
      <span>{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </span>
  )
}

type StayInfo = {
  id: string
  name: string
  address: string | null
  managerPhone: string | null
}

function placedStay(
  caravanId: string,
  gender: SolverGender,
  assignments: SolverAssignment[],
  accommodations: SolverAccommodation[],
): StayInfo | null {
  const placeId = assignments.find((row) => row.groupId === caravanId && row.gender === gender)?.placeId
  if (!placeId) return null
  const place = accommodations.find((item) => item.id === placeId)
  if (!place) return null
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    managerPhone: place.managerPhone,
  }
}

function CaravanInfoCard({
  caravan,
  locale,
  menPlace,
  womenPlace,
  menDistance,
  womenDistance,
  pairDistance,
  divided = true,
}: {
  caravan: SolverCaravan
  locale: string
  menPlace: StayInfo | null
  womenPlace: StayInfo | null
  menDistance?: string
  womenDistance?: string
  pairDistance?: string
  divided?: boolean
}) {
  const { t } = useTranslation()
  const missing = t('placements.systemNotSet')
  const origin =
    caravan.originCityNameFa || caravan.originCityNameEn
      ? geoName(
          { nameFa: caravan.originCityNameFa ?? '', nameEn: caravan.originCityNameEn ?? '' },
          locale,
        )
      : ''
  const people = (count: number) => t('placements.systemPeople', { count: formatNumber(count, locale) })
  const managerHref = caravan.managerUserId ? `/users/${caravan.managerUserId}` : null
  return (
    <div className={`flex flex-col gap-2 ${divided ? 'border-t border-teal-100 pt-2' : ''}`}>
      <InfoCell
        icon={Tent}
        label={t('placements.systemCaravanName')}
        value={caravan.name}
        href={caravan.caravanId ? `/caravans/${caravan.caravanId}` : null}
      />
      <InfoCell
        icon={UserRound}
        label={t('placements.systemCaravanManager')}
        value={caravan.managerName?.trim() || missing}
        href={caravan.managerName?.trim() ? managerHref : null}
      />
      <div className="grid grid-cols-2 gap-2">
        <InfoCell
          icon={Mars}
          label={t('placements.systemMen')}
          value={people(caravan.men)}
          href={`/reservations/${caravan.id}`}
        />
        <InfoCell
          icon={Venus}
          tone="pink"
          label={t('placements.systemWomen')}
          value={people(caravan.women)}
          href={`/reservations/${caravan.id}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoCell
          icon={MapPin}
          label={t('placements.systemOriginCity')}
          value={origin || missing}
          href={caravan.originCityId ? `/base-info/cities/${caravan.originCityId}` : null}
        />
        <InfoCell
          icon={Phone}
          label={t('placements.systemCaravanPhone')}
          value={caravan.managerPhone ? localizeDigits(caravan.managerPhone, locale) : missing}
          href={caravan.managerPhone ? managerHref : null}
          ltr
        />
      </div>
      {caravan.walkingRouteId && caravan.walkingRouteName ? (
        <InfoCell
          icon={Route}
          label={t('placements.systemWalkingRoute')}
          value={caravan.walkingRouteName}
          href={`/base-info/walking-routes/${caravan.walkingRouteId}`}
        />
      ) : null}
      {menDistance || womenDistance ? (
        <div className="grid grid-cols-2 gap-2">
          <InfoCell
            icon={Landmark}
            label={t('placements.systemMenToShrine')}
            value={menDistance || missing}
          />
          <InfoCell
            icon={Landmark}
            tone="pink"
            label={t('placements.systemWomenToShrine')}
            value={womenDistance || missing}
          />
        </div>
      ) : null}
      {pairDistance ? (
        <InfoCell icon={ArrowLeftRight} label={t('placements.systemDistancePair')} value={pairDistance} />
      ) : null}
      <StayTabs
        menPlace={menPlace}
        womenPlace={womenPlace}
        locale={locale}
        menShrine={menDistance}
        womenShrine={womenDistance}
        pairDistance={pairDistance}
      />
    </div>
  )
}

function CaravanIndexTabs({
  caravans,
  locale,
  stay,
  distance,
}: {
  caravans: SolverCaravan[]
  locale: string
  stay: (id: string, gender: SolverGender) => StayInfo | null
  distance: (id: string, kind: 'shrine-men' | 'shrine-women' | 'pair') => string | undefined
}) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const safeIndex = index < caravans.length ? index : 0
  const current = caravans[safeIndex]
  if (!current) return null
  const card = (divided: boolean) => (
    <CaravanInfoCard
      caravan={current}
      locale={locale}
      divided={divided}
      menPlace={stay(current.id, 'men')}
      womenPlace={stay(current.id, 'women')}
      menDistance={distance(current.id, 'shrine-men')}
      womenDistance={distance(current.id, 'shrine-women')}
      pairDistance={distance(current.id, 'pair')}
    />
  )
  if (caravans.length < 2) return card(true)
  return (
    <div className="flex flex-col gap-2 border-t border-teal-100 pt-2">
      <div role="tablist" className="flex flex-wrap gap-1.5">
        {caravans.map((item, itemIndex) => {
          const active = itemIndex === safeIndex
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.name}
              onClick={() => setIndex(itemIndex)}
              className={`min-w-20 cursor-pointer rounded-lg px-3 py-1.5 text-center text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                active ? 'bg-teal-500 text-white' : 'bg-cream-50 text-ink-700 hover:bg-teal-50'
              }`}
            >
              {t('placements.systemCaravanTab', { index: formatNumber(itemIndex + 1, locale) })}
            </button>
          )
        })}
      </div>
      {card(false)}
    </div>
  )
}

function StayTabs({
  menPlace,
  womenPlace,
  locale,
  menShrine,
  womenShrine,
  pairDistance,
}: {
  menPlace: StayInfo | null
  womenPlace: StayInfo | null
  locale: string
  menShrine?: string
  womenShrine?: string
  pairDistance?: string
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<SolverGender>('men')
  const place = tab === 'men' ? menPlace : womenPlace
  const tone = tab === 'women' ? 'pink' : 'teal'
  const missing = t('placements.systemNotSet')
  const shrine = tab === 'men' ? menShrine : womenShrine
  const OppositeIcon = tab === 'men' ? Venus : Mars
  const oppositeLabel =
    tab === 'men' ? t('placements.distanceToWomen') : t('placements.distanceToMen')
  const tabs: { id: SolverGender; label: string }[] = [
    { id: 'men', label: t('placements.systemMenPlace') },
    { id: 'women', label: t('placements.systemWomenPlace') },
  ]
  return (
    <div className="flex flex-col gap-2 border-t border-teal-100 pt-2">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-cream-50 p-1">
        {tabs.map((item) => {
          const active = tab === item.id
          const activeClass =
            item.id === 'women' ? 'bg-[#db2777] text-white' : 'bg-teal-500 text-white'
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                active ? activeClass : 'text-ink-600 hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <InfoCell
        icon={Building2}
        tone={tone}
        label={t('placements.systemStayName')}
        value={place?.name || missing}
        href={place ? `/accommodations/${place.id}` : null}
      />
      <InfoCell
        icon={MapPin}
        tone={tone}
        label={t('placements.systemAddress')}
        value={place?.address?.trim() || missing}
        wrap
      />
      <InfoCell
        icon={Phone}
        tone={tone}
        label={t('placements.systemManagerPhone')}
        value={place?.managerPhone?.trim() ? localizeDigits(place.managerPhone.trim(), locale) : missing}
        ltr={Boolean(place?.managerPhone?.trim())}
      />
      <InfoCell
        icon={Landmark}
        tone={tone}
        label={t('reservations.placementDistanceToShrine')}
        value={shrine || missing}
      />
      <InfoCell
        icon={OppositeIcon}
        tone={tone}
        label={oppositeLabel}
        value={pairDistance || missing}
      />
    </div>
  )
}

function InfoCell({
  icon: Icon,
  label,
  value,
  href,
  tone = 'teal',
  ltr = false,
  wrap = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  href?: string | null
  tone?: 'teal' | 'pink'
  ltr?: boolean
  wrap?: boolean
}) {
  const iconClass = tone === 'pink' ? 'bg-[#fce7f3] text-[#be185d]' : 'bg-teal-50 text-teal-700'
  const body = (
    <>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] leading-4 text-ink-500">{label}</span>
        <span
          dir={ltr ? 'ltr' : undefined}
          className={`block text-xs font-semibold ${href ? 'text-teal-800' : 'text-ink-900'} ${wrap ? 'whitespace-normal break-words' : 'truncate'} ${ltr ? 'text-start' : ''}`}
        >
          {value}
        </span>
      </span>
    </>
  )
  const box = 'flex min-w-0 items-center gap-2 rounded-xl bg-cream-50 px-2 py-1.5'
  if (!href) return <div className={box}>{body}</div>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${box} cursor-pointer hover:bg-teal-50`}
    >
      {body}
    </a>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  )
}
