import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ActionsTh,
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
  actionsColClassName,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import type { GoodsUnit, Paginated } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function GoodsUnitsListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['goods-units', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<GoodsUnit>>('/goods-units', {
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
  const emptyMessage = q ? t('goodsUnits.noResults') : t('goodsUnits.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.goodsUnits')}
        subtitle={t('goodsUnits.subtitle')}
        action={
          <Link to="/participations/goods-units/new">
            <Button>
              <Plus className="size-4" />
              {t('goodsUnits.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="goods-unit-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('goodsUnits.search')}
        placeholder={t('goodsUnits.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('goodsUnits.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="isActive" label={t('geo.isActive')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">
                  <GeoStatus active={item.isActive} />
                </td>
                <td className={actionsColClassName}>
                  <EntityRowActions
                    viewTo={`/participations/goods-units/${item.id}`}
                    editTo={`/participations/goods-units/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('goodsUnits.confirmDelete'),
                        successMessage: t('goodsUnits.deleted'),
                        path: `/goods-units/${item.id}`,
                        queryKey: ['goods-units'],
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
