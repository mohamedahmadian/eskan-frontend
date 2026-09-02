import { CalendarRange, Plus } from 'lucide-react'
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
import { localizeDigits } from '../../lib/datetime'
import type { Paginated, Restaurant } from '../../types/app'

export function RestaurantsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['restaurants', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Restaurant>>('/restaurants', {
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
  const emptyMessage = q ? t('restaurants.noResults') : t('restaurants.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.restaurantManagement')}
        subtitle={t('restaurants.subtitle')}
        action={
          <Link to="/logistics/restaurants/new">
            <Button>
              <Plus className="size-4" />
              {t('restaurants.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="restaurant-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('restaurants.search')}
        placeholder={t('restaurants.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('restaurants.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="managerName"
                label={t('restaurants.managerName')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="managerPhone"
                label={t('restaurants.managerPhone')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="address"
                label={t('restaurants.address')}
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
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.managerName || '—'}</td>
                <td className="px-4 py-3">
                  {item.managerPhone ? localizeDigits(item.managerPhone, locale) : '—'}
                </td>
                <td className="px-4 py-3">{item.address || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EntityRowActions
                      viewTo={`/logistics/restaurants/${item.id}`}
                      editTo={`/logistics/restaurants/${item.id}/edit`}
                      onDelete={() =>
                        confirmDelete({
                          message: t('restaurants.confirmDelete'),
                          successMessage: t('restaurants.deleted'),
                          path: `/restaurants/${item.id}`,
                          queryKey: ['restaurants'],
                        })
                      }
                    />
                    <Link to={`/logistics/restaurant-meal-plans?restaurantId=${item.id}`}>
                      <Button type="button" variant="soft">
                        <CalendarRange className="size-4" aria-hidden />
                        {t('restaurantMealPlans.manage')}
                      </Button>
                    </Link>
                  </div>
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
