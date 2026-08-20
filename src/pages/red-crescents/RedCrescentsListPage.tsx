import { Filter, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PaginationBar, SearchBar, TableCard, EntityRowActions, FilterPair } from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, Paginated, Province, RedCrescent } from '../../types/app'

export function RedCrescentsListPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const provinceId = searchParams.get('provinceId') ?? ''
  const cityId = searchParams.get('cityId') ?? ''

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
    queryKey: ['red-crescents', 'list', q, provinceId, cityId, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<RedCrescent>>('/red-crescents', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
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
  }).toString()
  const createTo = filterQuery
    ? `/base-info/red-crescents/new?${filterQuery}`
    : '/base-info/red-crescents/new'
  const rows = query.data?.items ?? []
  const emptyMessage = q || provinceId || cityId ? t('redCrescents.noResults') : t('redCrescents.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.redCrescents')}
        subtitle={t('redCrescents.subtitle')}
        action={
          <Link to={createTo}>
            <Button>
              <Plus className="size-4" />
              {t('redCrescents.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="red-crescent-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('redCrescents.search')}
        placeholder={t('redCrescents.searchPlaceholder')}
        filtersActive={Boolean(provinceId || cityId)}
        extra={
          <FilterPair>
            <FormField icon={Filter} label={t('geo.province')} htmlFor="red-crescent-province">
              <SearchSelect
                id="red-crescent-province"
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
            <FormField icon={Filter} label={t('geo.city')} htmlFor="red-crescent-city">
              <SearchSelect
                id="red-crescent-city"
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
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('redCrescents.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.province')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.city')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('redCrescents.phone')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{name(item.province)}</td>
                <td className="px-4 py-3">{name(item.city)}</td>
                <td className="px-4 py-3">{item.phone || '—'}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/red-crescents/${item.id}`}
                    editTo={`/base-info/red-crescents/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('redCrescents.confirmDelete'),
                        successMessage: t('redCrescents.deleted'),
                        path: `/red-crescents/${item.id}`,
                        queryKey: ['red-crescents'],
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
