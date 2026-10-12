import { Database, Plus, School } from 'lucide-react'
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
import type { Paginated, SchoolDistrict } from '../../types/app'

export function SchoolDistrictsListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['school-districts', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<SchoolDistrict>>('/school-districts', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Database}
        title={t('menus.accommodationBaseInfo')}
        subtitle={t('accommodationBaseInfo.subtitle')}
        action={
          <Link to="/accommodation-base-info/schools/new">
            <Button>
              <Plus className="size-4" />
              {t('schoolDistricts.create')}
            </Button>
          </Link>
        }
      />
      <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-teal-500 px-3 py-2 text-sm font-medium text-white shadow-sm"
          aria-current="page"
        >
          <School className="size-3.5" aria-hidden />
          {t('accommodationBaseInfo.tabs.schools')}
        </button>
      </nav>
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('schoolDistricts.search')}
        placeholder={t('schoolDistricts.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('schoolDistricts.noResults') : t('schoolDistricts.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('schoolDistricts.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="description"
                label={t('schoolDistricts.description')}
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
                <td className="px-4 py-3">{item.name}</td>
                <td className="max-w-md px-4 py-3 whitespace-pre-wrap">
                  {item.description?.trim() || '—'}
                </td>
                <td className={actionsColClassName}>
                  <EntityRowActions
                    viewTo={`/accommodation-base-info/schools/${item.id}`}
                    editTo={`/accommodation-base-info/schools/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('schoolDistricts.confirmDelete'),
                        successMessage: t('schoolDistricts.deleted'),
                        path: `/school-districts/${item.id}`,
                        queryKey: ['school-districts'],
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
