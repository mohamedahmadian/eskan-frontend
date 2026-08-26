import { Filter, Plus } from 'lucide-react'
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
import { useGeoName } from '../../lib/geo'
import type { City, Country, EntryBorder, Paginated, Province } from '../../types/app'
import { ENTRY_BORDER_TYPES } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function EntryBordersListPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const neighboringCountryId = searchParams.get('neighboringCountryId') ?? ''
  const provinceId = searchParams.get('provinceId') ?? ''
  const cityId = searchParams.get('cityId') ?? ''
  const borderType = searchParams.get('borderType') ?? ''
  const isActive = searchParams.get('isActive') ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })

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

  const query = useQuery({
    queryKey: [
      'entry-borders',
      'list',
      q,
      neighboringCountryId,
      provinceId,
      cityId,
      borderType,
      isActive,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<EntryBorder>>('/entry-borders', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(neighboringCountryId ? { neighboringCountryId } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
          ...(borderType ? { borderType } : {}),
          ...(isActive ? { isActive } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const filtersActive = Boolean(
    neighboringCountryId || provinceId || cityId || borderType || isActive,
  )
  const rows = query.data?.items ?? []
  const emptyMessage =
    q || filtersActive ? t('entryBorders.noResults') : t('entryBorders.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.entryBorders')}
        subtitle={t('entryBorders.subtitle')}
        action={
          <Link to="/base-info/entry-borders/new">
            <Button>
              <Plus className="size-4" />
              {t('entryBorders.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="entry-border-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('entryBorders.search')}
        placeholder={t('entryBorders.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair columns={3}>
            <FormField
              icon={Filter}
              label={t('entryBorders.neighboringCountry')}
              htmlFor="entry-border-country"
            >
              <SearchSelect
                id="entry-border-country"
                value={neighboringCountryId}
                placeholder={t('entryBorders.allCountries')}
                onChange={(next) =>
                  setParams({ neighboringCountryId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('entryBorders.allCountries') },
                  ...(countries.data ?? []).map((country) => ({
                    value: country.id,
                    label: name(country),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('geo.province')} htmlFor="entry-border-province">
              <SearchSelect
                id="entry-border-province"
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
            <FormField icon={Filter} label={t('geo.city')} htmlFor="entry-border-city">
              <SearchSelect
                id="entry-border-city"
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
            <FormField
              icon={Filter}
              label={t('entryBorders.borderType')}
              htmlFor="entry-border-type"
            >
              <SearchSelect
                id="entry-border-type"
                value={borderType}
                placeholder={t('entryBorders.allTypes')}
                onChange={(next) =>
                  setParams({ borderType: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('entryBorders.allTypes') },
                  ...ENTRY_BORDER_TYPES.map((type) => ({
                    value: type,
                    label: t(`entryBorders.types.${type}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('geo.isActive')} htmlFor="entry-border-status">
              <SearchSelect
                id="entry-border-status"
                value={isActive}
                placeholder={t('entryBorders.allStatuses')}
                onChange={(next) =>
                  setParams({ isActive: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('entryBorders.allStatuses') },
                  { value: 'true', label: t('geo.active') },
                  { value: 'false', label: t('geo.inactive') },
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
                label={t('entryBorders.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="neighboringCountry"
                label={t('entryBorders.neighboringCountry')}
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
                column="borderType"
                label={t('entryBorders.borderType')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="isActive"
                label={t('geo.isActive')}
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
                <td className="px-4 py-3">{name(item.neighboringCountry)}</td>
                <td className="px-4 py-3">{name(item.province)}</td>
                <td className="px-4 py-3">{name(item.city)}</td>
                <td className="px-4 py-3">{t(`entryBorders.types.${item.borderType}`)}</td>
                <td className="px-4 py-3">
                  <GeoStatus active={item.isActive} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/entry-borders/${item.id}`}
                    editTo={`/base-info/entry-borders/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('entryBorders.confirmDelete'),
                        successMessage: t('entryBorders.deleted'),
                        path: `/entry-borders/${item.id}`,
                        queryKey: ['entry-borders'],
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
