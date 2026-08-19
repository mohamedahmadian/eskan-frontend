import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PaginationBar, SearchBar, TableCard, EntityRowActions } from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Country, Paginated } from '../../types/app'
import { GeoStatus } from './GeoShared'

export function CountriesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['countries', 'list', q, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Country>>('/countries', {
        params: { q: q || undefined, page },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.countries')}
        subtitle={t('countries.subtitle')}
        action={
          <Link to="/base-info/countries/new">
            <Button>
              <Plus className="size-4" />
              {t('countries.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('countries.search')}
        placeholder={t('countries.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('countries.noResults') : t('countries.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('geo.nameFa')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.iso2')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.phoneCode')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.provinceCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.isActive')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((country) => (
              <tr key={country.id} className="border-t border-line">
                <td className="px-4 py-3">{name(country)}</td>
                <td className="px-4 py-3">{country.iso2}</td>
                <td className="px-4 py-3">{country.phoneCode ?? '—'}</td>
                <td className="px-4 py-3">
                  {formatNumber(country._count?.provinces ?? 0, locale)}
                </td>
                <td className="px-4 py-3">
                  <GeoStatus active={country.isActive} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/countries/${country.id}`}
                    editTo={`/base-info/countries/${country.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('countries.confirmDelete'),
                        successMessage: t('countries.deleted'),
                        path: `/countries/${country.id}`,
                        queryKey: ['countries'],
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
