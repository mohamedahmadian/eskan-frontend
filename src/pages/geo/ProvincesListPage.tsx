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
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Country, Paginated, Province } from '../../types/app'
import { GeoHas, GeoStatus } from './GeoShared'

export function ProvincesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const countryId = searchParams.get('countryId') ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['provinces', 'list', q, countryId, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Province>>('/provinces', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(countryId ? { countryId } : {}),
        },
      })
      return data
    },
  })

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q || countryId ? t('provinces.noResults') : t('provinces.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.provinces')}
        subtitle={t('provinces.subtitle')}
        action={
          <Link
            to={
              countryId
                ? `/base-info/provinces/new?countryId=${countryId}`
                : '/base-info/provinces/new'
            }
          >
            <Button>
              <Plus className="size-4" />
              {t('provinces.create')}
            </Button>
          </Link>
        }
      />
      <AppForm onSubmit={onSearch} className={`mb-4 grid gap-4 p-4 sm:grid-cols-2 ${cardClassName}`}>
        <FormField icon={Filter} label={t('geo.country')} htmlFor="province-country">
          <SearchSelect
            id="province-country"
            value={countryId}
            placeholder={t('geo.allCountries')}
            onChange={(next) =>
              setParams({ countryId: next || undefined }, { resetPage: true })
            }
            options={[
              { value: '', label: t('geo.allCountries') },
              ...(countries.data ?? []).map((country) => ({
                value: country.id,
                label: name(country),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Search} label={t('provinces.search')} htmlFor="province-search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="province-search"
              className={fieldClassName}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('provinces.searchPlaceholder')}
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
              <th className="px-4 py-3 text-start font-medium">{t('geo.nameFa')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.country')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.code')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.cityCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.hasRailway')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.hasAirport')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.isActive')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((province) => (
              <tr key={province.id} className="border-t border-line">
                <td className="px-4 py-3">{name(province)}</td>
                <td className="px-4 py-3">{name(province.country)}</td>
                <td className="px-4 py-3">{province.code}</td>
                <td className="px-4 py-3">
                  {formatNumber(province._count?.cities ?? 0, locale)}
                </td>
                <td className="px-4 py-3">
                  <GeoHas value={province.hasRailway} />
                </td>
                <td className="px-4 py-3">
                  <GeoHas value={province.hasAirport} />
                </td>
                <td className="px-4 py-3">
                  <GeoStatus active={province.isActive} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/provinces/${province.id}`}
                    editTo={`/base-info/provinces/${province.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('provinces.confirmDelete'),
                        successMessage: t('provinces.deleted'),
                        path: `/provinces/${province.id}`,
                        queryKey: ['provinces'],
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
