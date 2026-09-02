import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import type { Paginated, ParticipationCampaign } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function CampaignsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['participation-campaigns', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ParticipationCampaign>>('/participation-campaigns', {
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
  const emptyMessage = q ? t('participationCampaigns.noResults') : t('participationCampaigns.empty')
  const n = (value: number) => formatGroupedNumber(value, locale)

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.participationCampaigns')}
        subtitle={t('participationCampaigns.subtitle')}
        action={
          <Link to="/participations/campaigns/new">
            <Button>
              <Plus className="size-4" />
              {t('participationCampaigns.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="campaign-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('participationCampaigns.search')}
        placeholder={t('participationCampaigns.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('participationCampaigns.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="startDate" label={t('participationCampaigns.startDate')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="endDate" label={t('participationCampaigns.endDate')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="totalAmount" label={t('participations.totalAmount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="sharePrice" label={t('participations.sharePrice')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('participations.participants')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('participations.purchasedShares')}</th>
              <SortableTh column="isActive" label={t('geo.isActive')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3"><DateText value={item.startDate} /></td>
                <td className="px-4 py-3"><DateText value={item.endDate} /></td>
                <td className="px-4 py-3">{n(item.totalAmount)}</td>
                <td className="px-4 py-3">{n(item.sharePrice)}</td>
                <td className="px-4 py-3">{n(item.participantCount)}</td>
                <td className="px-4 py-3">{n(item.purchasedShares)} / {n(item.totalShares)}</td>
                <td className="px-4 py-3"><GeoStatus active={item.isActive} /></td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/participations/campaigns/${item.id}`}
                    editTo={`/participations/campaigns/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('participationCampaigns.confirmDelete'),
                        successMessage: t('participationCampaigns.deleted'),
                        path: `/participation-campaigns/${item.id}`,
                        queryKey: ['participation-campaigns'],
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
