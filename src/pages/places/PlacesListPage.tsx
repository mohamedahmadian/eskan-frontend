import { Filter, Plus, Tags } from 'lucide-react'
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
import { localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { City, Paginated, Place, PlaceType, Province } from '../../types/app'
import { PlaceTypeIcon } from '../place-types/PlaceTypeForm'

export function PlacesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const provinceId = searchParams.get('provinceId') ?? ''
  const cityId = searchParams.get('cityId') ?? ''
  const placeTypeId = searchParams.get('placeTypeId') ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces')
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

  const placeTypes = useQuery({
    queryKey: ['place-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<PlaceType[]>('/place-types')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['places', 'list', q, provinceId, cityId, placeTypeId, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Place>>('/places', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
          ...(placeTypeId ? { placeTypeId } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const filterQuery = new URLSearchParams({
    ...(provinceId ? { provinceId } : {}),
    ...(cityId ? { cityId } : {}),
    ...(placeTypeId ? { placeTypeId } : {}),
  }).toString()
  const createTo = filterQuery ? `/base-info/places/new?${filterQuery}` : '/base-info/places/new'
  const rows = query.data?.items ?? []
  const emptyMessage =
    q || provinceId || cityId || placeTypeId ? t('places.noResults') : t('places.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.places')}
        subtitle={t('places.subtitle')}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/base-info/places/types">
              <Button type="button" variant="soft">
                <Tags className="size-4" aria-hidden />
                {t('places.manageTypes')}
              </Button>
            </Link>
            <Link to={createTo}>
              <Button>
                <Plus className="size-4" />
                {t('places.create')}
              </Button>
            </Link>
          </div>
        }
      />
      <SearchBar
        inputId="place-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('places.search')}
        placeholder={t('places.searchPlaceholder')}
        filtersActive={Boolean(provinceId || cityId || placeTypeId)}
        extra={
          <FilterPair columns={3}>
            <FormField icon={Filter} label={t('geo.province')} htmlFor="place-province">
              <SearchSelect
                id="place-province"
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
            <FormField icon={Filter} label={t('geo.city')} htmlFor="place-city">
              <SearchSelect
                id="place-city"
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
            <FormField icon={Tags} label={t('places.placeType')} htmlFor="place-type">
              <SearchSelect
                id="place-type"
                value={placeTypeId}
                placeholder={t('places.allTypes')}
                onChange={(next) =>
                  setParams({ placeTypeId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('places.allTypes') },
                  ...(placeTypes.data ?? []).map((type) => ({
                    value: type.id,
                    label: name(type),
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
              <SortableTh column="name" label={t('places.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="placeType"
                label={t('places.placeType')}
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
              <SortableTh column="city" label={t('geo.city')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="phone" label={t('places.phone')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <PlaceTypeIcon name={item.placeType.icon} className="size-4 text-teal-600" />
                    {name(item.placeType)}
                  </span>
                </td>
                <td className="px-4 py-3">{name(item.province)}</td>
                <td className="px-4 py-3">{name(item.city)}</td>
                <td className="px-4 py-3">
                  {item.phone ? localizeDigits(item.phone, locale) : '—'}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/places/${item.id}`}
                    editTo={`/base-info/places/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('places.confirmDelete'),
                        successMessage: t('places.deleted'),
                        path: `/places/${item.id}`,
                        queryKey: ['places'],
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
