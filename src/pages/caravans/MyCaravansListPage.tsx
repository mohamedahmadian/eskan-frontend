import { History, Plus, Tent } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
} from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Caravan, Paginated } from '../../types/app'
import { useCaravanCreateQuota } from './caravan-create-quota'

export function MyCaravansListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const quota = useCaravanCreateQuota()
  const canCreate = quota.data?.allowed !== false
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const query = useQuery({
    queryKey: ['caravans', 'mine', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans/mine', {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Tent}
        title={t('menus.myCaravans')}
        subtitle={t('myCaravans.subtitle')}
        action={
          canCreate ? (
            <Link to="/my-caravans/new">
              <Button>
                <Plus className="size-4" />
                {t('caravans.create')}
              </Button>
            </Link>
          ) : null
        }
      />
      {quota.data && !quota.data.allowed ? (
        <p className="rounded-[22px] border border-teal-100 bg-white px-4 py-3 text-sm leading-7 text-ink-700 shadow-[0_8px_20px_rgba(20,40,40,0.04)]">
          {t('caravans.maxPerNationalIdReached', {
            max: formatNumber(quota.data.max, locale),
            year: formatNumber(quota.data.year, locale),
          })}
        </p>
      ) : null}
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('myCaravans.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('myCaravans.noResults') : t('myCaravans.empty')}
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
                <td className="px-4 py-3">
                  {caravan.isActive ? t('geo.active') : t('geo.inactive')}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/my-caravans/${caravan.id}`}
                    extra={
                      <Link to={`/my-caravans/${caravan.id}/pilgrimage-history`}>
                        <Button type="button" variant="soft">
                          <History className="size-4" aria-hidden />
                          {t('caravanPilgrimageHistory.open')}
                        </Button>
                      </Link>
                    }
                    editTo={`/my-caravans/${caravan.id}/edit`}
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
