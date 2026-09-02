import { Filter, Mars, Plus, Venus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { City, Country, Paginated, Province, WalkingStation } from '../../types/app'

export function WalkingStationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
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

  const query = useQuery({
    queryKey: ['walking-stations', 'list', q, provinceId, cityId, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingStation>>('/walking-stations', {
        params: {
          page,
          ...(q ? { q } : {}),
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
  const emptyMessage =
    q || provinceId || cityId ? t('walkingStations.noResults') : t('walkingStations.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.walkingStations')}
        subtitle={t('walkingStations.subtitle')}
        action={
          <Link to="/base-info/walking-stations/new">
            <Button>
              <Plus className="size-4" />
              {t('walkingStations.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="station-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('walkingStations.search')}
        placeholder={t('walkingStations.searchPlaceholder')}
        filtersActive={Boolean(provinceId || cityId)}
        extra={
          <FilterPair>
            <FormField icon={Filter} label={t('geo.province')} htmlFor="station-province">
              <SearchSelect
                id="station-province"
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
            <FormField icon={Filter} label={t('geo.city')} htmlFor="station-city">
              <SearchSelect
                id="station-city"
                value={cityId}
                disabled={!provinceId}
                placeholder={t('geo.allCities')}
                onChange={(next) => setParams({ cityId: next || undefined }, { resetPage: true })}
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
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('walkingStations.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="province"
                label={t('geo.province')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t('geo.city')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="address"
                label={t('walkingStations.address')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="maleCount"
                label={t('walkingStations.maleCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="femaleCount"
                label={t('walkingStations.femaleCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="managerName"
                label={t('walkingStations.managerName')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="routeCount"
                label={t('walkingStations.routeCount')}
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
                <td className="px-4 py-3">{name(item.city.province)}</td>
                <td className="px-4 py-3">{name(item.city)}</td>
                <td className="px-4 py-3">{item.address || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Mars className="size-4 text-sky-400" aria-hidden />
                    {formatNumber(item.maleCount, locale)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Venus className="size-4 text-pink-400" aria-hidden />
                    {formatNumber(item.femaleCount, locale)}
                  </span>
                </td>
                <td className="px-4 py-3">{item.managerName || '—'}</td>
                <td className="px-4 py-3">{formatNumber(item.routes.length, locale)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/walking-stations/${item.id}`}
                    editTo={`/base-info/walking-stations/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('walkingStations.confirmDelete'),
                        successMessage: t('walkingStations.deleted'),
                        path: `/walking-stations/${item.id}`,
                        queryKey: ['walking-stations'],
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
    </div>
  )
}
