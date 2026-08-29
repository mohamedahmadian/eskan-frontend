import { Fence, Globe2, MapPin, MapPinned, Milestone, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  FilterPair,
  SortableTh,
} from '../../components/ui/ListControls'
import {
  Button,
  FormField,
  PageHeader,
  listShellClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { City, Country, EntryBorder, Paginated, Province, WalkingRoute } from '../../types/app'
import { WalkingRouteStationsModal } from './WalkingRouteStationsModal'

export function WalkingRoutesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const [stationsRoute, setStationsRoute] = useState<WalkingRoute | null>(null)
  const originCountryId = searchParams.get('originCountryId') ?? ''
  const entryBorderId = searchParams.get('entryBorderId') ?? ''
  const provinceId = searchParams.get('provinceId') ?? ''
  const cityId = searchParams.get('cityId') ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })

  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', iranId],
    enabled: Boolean(iranId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: iranId },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId },
      })
      return data
    },
  })

  const entryBorders = useQuery({
    queryKey: ['entry-borders', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<EntryBorder[]>('/entry-borders')
      return data
    },
  })

  const query = useQuery({
    queryKey: [
      'walking-routes',
      'list',
      q,
      originCountryId,
      entryBorderId,
      provinceId,
      cityId,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(originCountryId ? { originCountryId } : {}),
          ...(entryBorderId ? { entryBorderId } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const hasFilter = Boolean(q || originCountryId || entryBorderId || provinceId || cityId)
  const emptyMessage = hasFilter ? t('walkingRoutes.noResults') : t('walkingRoutes.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.walkingRoutes')}
        subtitle={t('walkingRoutes.subtitle')}
        action={
          <Link to="/base-info/walking-routes/new">
            <Button>
              <Plus className="size-4" />
              {t('walkingRoutes.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="route-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('walkingRoutes.search')}
        placeholder={t('walkingRoutes.searchPlaceholder')}
        filtersActive={Boolean(originCountryId || entryBorderId || provinceId || cityId)}
        extra={
          <>
            <FilterPair>
              <FormField
                icon={Fence}
                label={t('walkingRoutes.entryBorder')}
                htmlFor="route-entry-border"
              >
                <SearchSelect
                  id="route-entry-border"
                  value={entryBorderId}
                  placeholder={t('walkingRoutes.allEntryBorders')}
                  onChange={(next) =>
                    setParams({ entryBorderId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('walkingRoutes.allEntryBorders') },
                    ...(entryBorders.data ?? []).map((border) => ({
                      value: border.id,
                      label: border.name,
                    })),
                  ]}
                />
              </FormField>
              <FormField icon={Globe2} label={t('walkingRoutes.originCountry')} htmlFor="route-origin">
                <SearchSelect
                  id="route-origin"
                  value={originCountryId}
                  placeholder={t('walkingRoutes.allOriginCountries')}
                  onChange={(next) =>
                    setParams({ originCountryId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('walkingRoutes.allOriginCountries') },
                    ...(countries.data ?? []).map((country) => ({
                      value: country.id,
                      label: name(country),
                    })),
                  ]}
                />
              </FormField>
            </FilterPair>
            <FilterPair>
              <FormField icon={MapPinned} label={t('geo.province')} htmlFor="route-province">
                <SearchSelect
                  id="route-province"
                  value={provinceId}
                  placeholder={t('geo.allProvinces')}
                  onChange={(next) =>
                    setParams(
                      { provinceId: next || undefined, cityId: undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: '', label: t('geo.allProvinces') },
                    ...(provinces.data ?? []).map((province) => ({
                      value: province.id,
                      label: name(province),
                    })),
                  ]}
                />
              </FormField>
              <FormField icon={MapPin} label={t('geo.city')} htmlFor="route-city">
                <SearchSelect
                  id="route-city"
                  value={cityId}
                  disabled={!provinceId}
                  placeholder={t('geo.allCities')}
                  onChange={(next) =>
                    setParams({ cityId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('geo.allCities') },
                    ...(cities.data ?? []).map((city) => ({
                      value: city.id,
                      label: name(city),
                    })),
                  ]}
                />
              </FormField>
            </FilterPair>
          </>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('walkingRoutes.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="entryBorder"
                label={t('walkingRoutes.entryBorder')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.originCountries')}</th>
              <SortableTh
                column="distanceToMashhadKm"
                label={t('walkingRoutes.distanceToMashhadKm')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="stageCount"
                label={t('walkingRoutes.stageCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.entryBorder.name}</td>
                <td className="px-4 py-3">
                  {item.originCountries.map((country) => name(country)).join('، ') || '—'}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(item.distanceToMashhadKm, locale)} {t('walkingRoutes.km')}
                </td>
                <td className="px-4 py-3">{formatNumber(item.stages.length, locale)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/walking-routes/${item.id}`}
                    extra={
                      <Button type="button" variant="soft" onClick={() => setStationsRoute(item)}>
                        <Milestone className="size-4" aria-hidden />
                        {t('walkingRoutes.stages')}
                      </Button>
                    }
                    editTo={`/base-info/walking-routes/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('walkingRoutes.confirmDelete'),
                        successMessage: t('walkingRoutes.deleted'),
                        path: `/walking-routes/${item.id}`,
                        queryKey: ['walking-routes'],
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
      {stationsRoute ? (
        <WalkingRouteStationsModal
          routeId={stationsRoute.id}
          initialRoute={stationsRoute}
          onClose={() => setStationsRoute(null)}
        />
      ) : null}
    </div>
  )
}
