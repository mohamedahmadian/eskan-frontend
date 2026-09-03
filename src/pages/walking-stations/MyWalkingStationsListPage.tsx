import { MapPin, Mars, Milestone, Venus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Paginated, WalkingStation } from '../../types/app'

export function MyWalkingStationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)

  const query = useQuery({
    queryKey: ['walking-stations', 'mine', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingStation>>('/walking-stations/mine', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('menus.myWalkingStations')} subtitle={t('myWalkingStations.subtitle')} />
      <SearchBar
        inputId="my-station-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('walkingStations.search')}
        placeholder={t('myWalkingStations.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('myWalkingStations.noResults') : t('myWalkingStations.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('walkingStations.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t('geo.city')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="address"
                label={t('walkingStations.address')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="maleCount"
                label={t('walkingStations.maleCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="femaleCount"
                label={t('walkingStations.femaleCount')}
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
                    <Milestone className="size-4 text-teal-600" aria-hidden />
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-ink-400" aria-hidden />
                    {name(item.city)}
                  </span>
                </td>
                <td className="px-4 py-3">{item.address || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Mars className="size-4 text-sky-400" aria-hidden />
                    {formatNumber(item.maleCount, locale)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Venus className="size-4 text-pink-400" aria-hidden />
                    {formatNumber(item.femaleCount, locale)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/my-walking-stations/${item.id}`}
                    editTo={`/my-walking-stations/${item.id}/edit`}
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
