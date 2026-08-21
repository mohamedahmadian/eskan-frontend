import { History, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { PaginationBar, SearchBar, TableCard } from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { Caravan, Paginated } from '../../types/app'

export function MyCaravansListPage() {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()
  const query = useQuery({
    queryKey: ['caravans', 'mine', q, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans/mine', {
        params: { q: q || undefined, page },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.myCaravans')}
        subtitle={t('myCaravans.subtitle')}
        action={
          <Link to="/my-caravans/new">
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
              <th className="px-4 py-3 text-start font-medium">{t('caravans.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.city')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.status')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((caravan) => (
              <tr key={caravan.id} className="border-t border-line">
                <td className="px-4 py-3">{caravan.name}</td>
                <td className="px-4 py-3">{caravan.city ? nameOf(caravan.city) : '—'}</td>
                <td className="px-4 py-3">
                  {caravan.isActive ? t('geo.active') : t('geo.inactive')}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/my-caravans/${caravan.id}/pilgrimage-history`}>
                    <Button type="button" variant="gold">
                      <History className="size-4" aria-hidden />
                      {t('caravanPilgrimageHistory.open')}
                    </Button>
                  </Link>
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
