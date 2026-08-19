import { Filter, Plus, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PaginationBar, TableCard, EntityRowActions } from '../../components/ui/ListControls'
import { AppForm, Button, FormField, PageHeader, cardClassName, fieldClassName, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { Benefactor, City, Paginated, Province } from '../../types/app'

export function BenefactorsListPage() {
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
    queryKey: ['benefactors', 'list', q, provinceId, cityId, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Benefactor>>('/benefactors', {
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

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const filterQuery = new URLSearchParams({
    ...(provinceId ? { provinceId } : {}),
    ...(cityId ? { cityId } : {}),
  }).toString()
  const createTo = filterQuery
    ? `/base-info/benefactors/new?${filterQuery}`
    : '/base-info/benefactors/new'
  const rows = query.data?.items ?? []
  const emptyMessage = q || provinceId || cityId ? t('benefactors.noResults') : t('benefactors.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.benefactors')}
        subtitle={t('benefactors.subtitle')}
        action={
          <Link to={createTo}>
            <Button>
              <Plus className="size-4" />
              {t('benefactors.create')}
            </Button>
          </Link>
        }
      />
      <AppForm onSubmit={onSearch} className={`mb-4 grid gap-4 p-4 sm:grid-cols-3 ${cardClassName}`}>
        <FormField icon={Filter} label={t('geo.province')} htmlFor="benefactor-province">
          <SearchSelect
            id="benefactor-province"
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
        <FormField icon={Filter} label={t('geo.city')} htmlFor="benefactor-city">
          <SearchSelect
            id="benefactor-city"
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
        <FormField icon={Search} label={t('benefactors.search')} htmlFor="benefactor-search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="benefactor-search"
              className={fieldClassName}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('benefactors.searchPlaceholder')}
            />
            <Button type="submit" className="sm:min-w-28">
              <Search className="size-4" />
              {t('common.search')}
            </Button>
          </div>
        </FormField>
      </AppForm>
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('benefactors.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.province')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.city')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('benefactors.phone')}</th>
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
                    viewTo={`/base-info/benefactors/${item.id}`}
                    editTo={`/base-info/benefactors/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('benefactors.confirmDelete'),
                        successMessage: t('benefactors.deleted'),
                        path: `/benefactors/${item.id}`,
                        queryKey: ['benefactors'],
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
