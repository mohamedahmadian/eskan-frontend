import { HeartHandshake, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import type { HonoraryServiceType, Paginated } from '../../types/app'

export function HonoraryServiceTypesListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['honorary-service-types', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HonoraryServiceType>>('/honorary-service-types', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.honoraryServiceTypes')}
        subtitle={t('honoraryServiceTypes.subtitle')}
        action={
          <Link to="/honorary-service-types/new">
            <Button>
              <Plus className="size-4" />
              {t('honoraryServiceTypes.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="honorary-service-type-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('honoraryServiceTypes.search')}
        placeholder={t('honoraryServiceTypes.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('honoraryServiceTypes.noResults') : t('honoraryServiceTypes.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('honoraryServiceTypes.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="description"
                label={t('honoraryServiceTypes.description')}
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
                    <HeartHandshake className="size-4 text-teal-600" aria-hidden />
                    {item.name}
                  </span>
                </td>
                <td className="max-w-md px-4 py-3 text-ink-600">
                  <span className="line-clamp-2">{item.description}</span>
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/honorary-service-types/${item.id}`}
                    editTo={`/honorary-service-types/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('honoraryServiceTypes.confirmDelete'),
                        successMessage: t('honoraryServiceTypes.deleted'),
                        path: `/honorary-service-types/${item.id}`,
                        queryKey: ['honorary-service-types'],
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
