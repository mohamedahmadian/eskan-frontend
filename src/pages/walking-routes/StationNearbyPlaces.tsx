import { Landmark, MapPin, Phone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FormEmptyHint, FormSectionTitle } from '../../components/ui/FormLayout'
import { api } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { haversineKm, useGeoName } from '../../lib/geo'
import { getNavIcon } from '../../lib/icons'
import type { Place, PlaceType } from '../../types/app'

type NearbyPlace = Place & { distanceKm: number | null }

function sortNearby(items: NearbyPlace[], locale: string) {
  return [...items].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) {
      return a.name.localeCompare(b.name, locale)
    }
    if (a.distanceKm == null) return 1
    if (b.distanceKm == null) return -1
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
    return a.name.localeCompare(b.name, locale)
  })
}

export function StationNearbyPlaces({
  cityId,
  latitude,
  longitude,
  compact = false,
}: {
  cityId: string
  latitude?: number | null
  longitude?: number | null
  compact?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const [tabId, setTabId] = useState('')
  const hasOrigin = latitude != null && longitude != null

  const typesQuery = useQuery({
    queryKey: ['place-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<PlaceType[]>('/place-types', {
        params: { activeOnly: true },
      })
      return data
    },
  })

  const query = useQuery({
    queryKey: ['places', 'city', cityId],
    enabled: Boolean(cityId),
    queryFn: async () => {
      const { data } = await api.get<Place[]>('/places', {
        params: { cityId },
      })
      return data
    },
  })

  const ranked = useMemo(() => {
    const items = query.data ?? []
    const withDistance: NearbyPlace[] = items.map((item) => {
      if (hasOrigin && item.latitude != null && item.longitude != null) {
        return {
          ...item,
          distanceKm: haversineKm(latitude, longitude, item.latitude, item.longitude),
        }
      }
      return { ...item, distanceKm: null }
    })
    return sortNearby(withDistance, locale)
  }, [hasOrigin, latitude, locale, longitude, query.data])

  const tabs = useMemo(() => {
    const typeOrder = new Map((typesQuery.data ?? []).map((item) => [item.id, item.sortOrder]))
    const groups = new Map<string, { type: Place['placeType']; items: NearbyPlace[] }>()
    for (const item of ranked) {
      const current = groups.get(item.placeTypeId) ?? { type: item.placeType, items: [] }
      current.items.push(item)
      groups.set(item.placeTypeId, current)
    }
    return [...groups.values()].sort((a, b) => {
      const orderA = typeOrder.get(a.type.id) ?? Number.MAX_SAFE_INTEGER
      const orderB = typeOrder.get(b.type.id) ?? Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) return orderA - orderB
      return name(a.type).localeCompare(name(b.type), locale)
    })
  }, [locale, name, ranked, typesQuery.data])

  useEffect(() => {
    if (!tabs.length) {
      setTabId('')
      return
    }
    if (!tabs.some((tab) => tab.type.id === tabId)) {
      setTabId(tabs[0].type.id)
    }
  }, [tabId, tabs])

  const active = tabs.find((tab) => tab.type.id === tabId) ?? tabs[0]

  return (
    <section className="space-y-3">
      <FormSectionTitle icon={Landmark} className="mb-0">
        {t('walkingRoutes.sectionNearby')}
      </FormSectionTitle>
      {!hasOrigin ? (
        <p className="text-xs text-ink-500">{t('walkingRoutes.nearbyNoStationCoords')}</p>
      ) : null}
      {query.isLoading ? (
        <p className="text-xs text-ink-500">{t('common.loading')}</p>
      ) : !tabs.length ? (
        <FormEmptyHint>{t('walkingRoutes.nearbyEmpty')}</FormEmptyHint>
      ) : (
        <div className="space-y-3">
          <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-2">
            {tabs.map((tab) => {
              const Icon = getNavIcon(tab.type.icon)
              const activeTab = tab.type.id === active?.type.id
              return (
                <button
                  key={tab.type.id}
                  type="button"
                  onClick={() => setTabId(tab.type.id)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    activeTab
                      ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                      : 'bg-white text-ink-700 hover:bg-cream-100'
                  }`}
                >
                  <Icon
                    className={`size-3.5 ${activeTab ? 'text-white' : 'text-teal-600'}`}
                    aria-hidden
                  />
                  <span>{name(tab.type)}</span>
                  <span
                    className={`rounded-full px-1.5 text-[11px] ${
                      activeTab ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'
                    }`}
                  >
                    {formatNumber(tab.items.length, locale)}
                  </span>
                </button>
              )
            })}
          </nav>
          {active?.items.length ? (
            <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2 sm:gap-3'}`}>
              {active.items.map((item) => (
                <article
                  key={item.id}
                  className="space-y-1.5 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/base-info/places/${item.id}`}
                      className="min-w-0 text-sm font-semibold text-teal-800 hover:underline"
                    >
                      {item.name}
                    </Link>
                    {item.distanceKm != null ? (
                      <span className="shrink-0 text-[11px] font-medium text-ink-500">
                        {t('walkingRoutes.nearbyDistance', {
                          value: formatNumber(Number(item.distanceKm.toFixed(1)), locale),
                        })}
                      </span>
                    ) : null}
                  </div>
                  {item.phone ? (
                    <p className="flex items-center gap-1.5 text-xs text-ink-600">
                      <Phone className="size-3.5 text-teal-600" aria-hidden />
                      <span dir="ltr">{localizeDigits(item.phone, locale)}</span>
                    </p>
                  ) : null}
                  {item.address?.trim() ? (
                    <p className="flex items-start gap-1.5 text-xs text-ink-600">
                      <MapPin className="size-3.5 shrink-0 text-teal-600" aria-hidden />
                      <span>{item.address}</span>
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <FormEmptyHint>{t('walkingRoutes.nearbyTypeEmpty')}</FormEmptyHint>
          )}
        </div>
      )}
    </section>
  )
}
