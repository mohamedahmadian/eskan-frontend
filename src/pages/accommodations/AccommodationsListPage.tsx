import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PaginationBar, SearchBar, TableCard, EntityRowActions } from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Accommodation, Paginated } from '../../types/app'

export function AccommodationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['accommodations', q, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Accommodation>>('/accommodations', {
        params: { q: q || undefined, page },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.accommodations')}
        subtitle={t('accommodations.subtitle')}
        action={
          <Link to="/accommodations/new">
            <Button>
              <Plus className="size-4" />
              {t('accommodations.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('accommodations.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('accommodations.noResults') : t('accommodations.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.type')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.status')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('geo.city')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.genderType')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{t(`accommodationTypes.${item.type}`)}</td>
                <td className="px-4 py-3">{t(`accommodationStatuses.${item.status}`)}</td>
                <td className="px-4 py-3">{item.city ? name(item.city) : '—'}</td>
                <td className="px-4 py-3">
                  {t(`genderTypes.${item.genderType}`)}
                  <span className="ms-2 text-ink-400">
                    {formatNumber(item.maleCapacity, locale)} / {formatNumber(item.femaleCapacity, locale)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/accommodations/${item.id}`}
                    editTo={`/accommodations/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('accommodations.confirmDelete'),
                        successMessage: t('accommodations.deleted'),
                        path: `/accommodations/${item.id}`,
                        queryKey: ['accommodations'],
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
