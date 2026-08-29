import { Plus } from 'lucide-react'
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
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Paginated, PlaceType } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'
import { PlaceTypeIcon } from './PlaceTypeForm'

export function PlaceTypesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['place-types', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PlaceType>>('/place-types', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.placeTypes')}
        subtitle={t('placeTypes.subtitle')}
        action={
          <Link to="/base-info/places/types/new">
            <Button>
              <Plus className="size-4" />
              {t('placeTypes.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="place-type-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('placeTypes.search')}
        placeholder={t('placeTypes.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('placeTypes.noResults') : t('placeTypes.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="nameFa" label={t('geo.nameFa')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="code" label={t('placeTypes.code')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="placeCount"
                label={t('placeTypes.placeCount')}
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
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <PlaceTypeIcon name={item.icon} className="size-4 text-teal-600" />
                    {name(item)}
                  </span>
                </td>
                <td className="px-4 py-3">{item.code}</td>
                <td className="px-4 py-3">{formatNumber(item._count?.places ?? 0, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.sortOrder, locale)}</td>
                <td className="px-4 py-3">
                  <GeoStatus active={item.isActive} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/places/types/${item.id}`}
                    editTo={`/base-info/places/types/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('placeTypes.confirmDelete'),
                        successMessage: t('placeTypes.deleted'),
                        path: `/place-types/${item.id}`,
                        queryKey: ['place-types'],
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
