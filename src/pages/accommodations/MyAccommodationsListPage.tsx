import { Building2, MapPin, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
} from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { Accommodation, Paginated } from '../../types/app'

export function MyAccommodationsListPage() {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const query = useQuery({
    queryKey: ['accommodations', 'mine', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Accommodation>>('/accommodations/mine', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.myAccommodations')}
        subtitle={t('myAccommodations.subtitle')}
        action={
          <Link to="/my-accommodations/new">
            <Button>
              <Plus className="size-4" />
              {t('accommodations.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('myAccommodations.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('myAccommodations.noResults') : t('myAccommodations.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('accommodations.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="type"
                label={t('accommodations.type')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {t('geo.city')}
                </span>
              </th>
              <SortableTh
                column="genderType"
                label={t('accommodations.genderType')}
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
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="size-4 text-teal-600" aria-hidden />
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3">{t(`accommodationTypes.${item.type}`)}</td>
                <td className="px-4 py-3">{item.city ? nameOf(item.city) : '—'}</td>
                <td className="px-4 py-3">{t(`genderTypes.${item.genderType}`)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/my-accommodations/${item.id}`}
                    editTo={`/my-accommodations/${item.id}/edit`}
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
