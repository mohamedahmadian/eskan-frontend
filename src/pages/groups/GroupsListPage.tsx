import { Plus } from 'lucide-react'
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
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Group, Paginated } from '../../types/app'

export function GroupsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const query = useQuery({
    queryKey: ['groups', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Group>>('/groups', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.groupsList')}
        subtitle={t('groups.subtitle')}
        action={
          <Link to="/groups/new">
            <Button>
              <Plus className="size-4" />
              {t('groups.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('groups.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('groups.noResults') : t('groups.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('groups.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t('groups.city')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="manager"
                label={t('groups.manager')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="maleCount"
                label={t('groups.maleCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="femaleCount"
                label={t('groups.femaleCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="totalCount"
                label={t('groups.totalCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((group) => (
              <tr key={group.id} className="border-t border-line">
                <td className="px-4 py-3">{group.name}</td>
                <td className="px-4 py-3">{group.city ? nameOf(group.city) : '—'}</td>
                <td className="px-4 py-3">{group.manager?.fullName ?? '—'}</td>
                <td className="px-4 py-3">{formatNumber(group.maleCount, locale)}</td>
                <td className="px-4 py-3">{formatNumber(group.femaleCount, locale)}</td>
                <td className="px-4 py-3">{formatNumber(group.totalCount, locale)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/groups/${group.id}`}
                    editTo={`/groups/${group.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('groups.confirmDelete'),
                        successMessage: t('groups.deleted'),
                        path: `/groups/${group.id}`,
                        queryKey: ['groups'],
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
