import { Plus, Upload } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { Caravan, Paginated } from '../../types/app'

export function CaravansListPage() {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const query = useQuery({
    queryKey: ['caravans', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.caravansList')}
        subtitle={t('caravans.subtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/caravans/import">
              <Button type="button" variant="soft">
                <Upload className="size-4" />
                {t('caravans.import')}
              </Button>
            </Link>
            <Link to="/caravans/new">
              <Button>
                <Plus className="size-4" />
                {t('caravans.create')}
              </Button>
            </Link>
          </div>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('caravans.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('caravans.noResults') : t('caravans.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('caravans.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t('caravans.city')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="walkingRoute"
                label={t('caravans.walkingRoute')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="manager"
                label={t('caravans.manager')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="isActive"
                label={t('caravans.status')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((caravan) => (
              <tr key={caravan.id} className="border-t border-line">
                <td className="px-4 py-3">{caravan.name}</td>
                <td className="px-4 py-3">{caravan.city ? nameOf(caravan.city) : '—'}</td>
                <td className="px-4 py-3">{caravan.walkingRoute?.name ?? '—'}</td>
                <td className="px-4 py-3">{caravan.manager?.fullName ?? '—'}</td>
                <td className="px-4 py-3">
                  {caravan.isActive ? t('geo.active') : t('geo.inactive')}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/caravans/${caravan.id}`}
                    editTo={`/caravans/${caravan.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('caravans.confirmDelete'),
                        successMessage: t('caravans.deleted'),
                        path: `/caravans/${caravan.id}`,
                        queryKey: ['caravans'],
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
