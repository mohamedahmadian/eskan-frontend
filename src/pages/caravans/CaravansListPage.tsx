import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PaginationBar, SearchBar, TableCard, EntityRowActions } from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import type { Caravan, Paginated } from '../../types/app'

export function CaravansListPage() {
  const { t } = useTranslation()
  const { confirmDelete } = useConfirmDelete()
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()
  const query = useQuery({
    queryKey: ['caravans', q, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans', {
        params: { q: q || undefined, page },
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
          <Link to="/caravans/new">
            <Button>
              <Plus className="size-4" />
              {t('caravans.create')}
            </Button>
          </Link>
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
              <th className="px-4 py-3 text-start font-medium">{t('caravans.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.originCity')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((caravan) => (
              <tr key={caravan.id} className="border-t border-line">
                <td className="px-4 py-3">{caravan.name}</td>
                <td className="px-4 py-3">{caravan.originCity}</td>
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
