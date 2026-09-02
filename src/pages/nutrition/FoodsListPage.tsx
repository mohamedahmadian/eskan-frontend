import { Plus, UtensilsCrossed } from 'lucide-react'
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
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { Food, Paginated } from '../../types/app'

export function FoodsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['foods', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Food>>('/foods', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q ? t('foods.noResults') : t('foods.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.foodManagement')}
        subtitle={t('foods.subtitle')}
        action={
          <Link to="/logistics/foods/new">
            <Button>
              <Plus className="size-4" />
              {t('foods.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="food-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('foods.search')}
        placeholder={t('foods.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('foods.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="ingredientsCount"
                label={t('foods.ingredientsCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('foods.costPrice')}</th>
              <SortableTh
                column="finalPrice"
                label={t('foods.finalPrice')}
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
                    <UtensilsCrossed className="size-4 text-teal-600" aria-hidden />
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3">{formatNumber(item.ingredientsCount, locale)}</td>
                <td className="px-4 py-3">
                  {formatGroupedNumber(item.costPrice, locale)} {t('foods.toman')}
                </td>
                <td className="px-4 py-3">
                  {formatGroupedNumber(item.finalPrice, locale)} {t('foods.toman')}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/logistics/foods/${item.id}`}
                    editTo={`/logistics/foods/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('foods.confirmDelete'),
                        successMessage: t('foods.deleted'),
                        path: `/foods/${item.id}`,
                        queryKey: ['foods'],
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
