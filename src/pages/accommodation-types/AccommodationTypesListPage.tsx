import { Plus, Tags } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ActionsTh,
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
  actionsColClassName,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { AccommodationType, Paginated } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'
import { AccommodationTypeIcon } from './AccommodationTypeForm'

export function AccommodationTypesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['accommodation-types', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AccommodationType>>('/accommodation-types', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Tags}
        title={t('menus.accommodationTypeManagement')}
        subtitle={t('accommodationType.subtitle')}
        action={
          <Link to="/accommodation-types/new">
            <Button>
              <Plus className="size-4" />
              {t('accommodationType.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('accommodationType.search')}
        placeholder={t('accommodationType.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('accommodationType.noResults') : t('accommodationType.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="nameFa" label={t('geo.nameFa')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="code" label={t('accommodationType.code')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="accommodationCount"
                label={t('accommodationType.accommodationCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="sortOrder"
                label={t('geo.sortOrder')}
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
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <AccommodationTypeIcon name={item.icon} className="size-4 text-teal-600" />
                    {name(item)}
                  </span>
                </td>
                <td className="px-4 py-3">{item.code}</td>
                <td className="px-4 py-3">{formatNumber(item._count?.accommodations ?? 0, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.sortOrder, locale)}</td>
                <td className="px-4 py-3">
                  <GeoStatus active={item.isActive} />
                </td>
                <td className={actionsColClassName}>
                  <EntityRowActions
                    viewTo={`/accommodation-types/${item.id}`}
                    editTo={`/accommodation-types/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('accommodationType.confirmDelete'),
                        successMessage: t('accommodationType.deleted'),
                        path: `/accommodation-types/${item.id}`,
                        queryKey: ['accommodation-types'],
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
