import { Plus, Users } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
} from '../../components/ui/ListControls'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  listShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import type { Contribution, Paginated, ParticipationCampaign } from '../../types/app'

export function ParticipantsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id: campaignId } = useParams()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const queryClient = useQueryClient()

  const campaign = useQuery({
    queryKey: ['participation-campaign', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign>(`/participation-campaigns/${campaignId}`)
      return data
    },
  })

  const query = useQuery({
    queryKey: ['contributions', 'campaign', campaignId, 'list', q, page, sortBy, sortDir],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Contribution>>('/contributions', {
        params: {
          page,
          campaignId,
          ...(q ? { q } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  if (!campaign.data) {
    return <LoadingState />
  }

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q ? t('campaignParticipants.noResults') : t('campaignParticipants.empty')
  const n = (value: number) => formatGroupedNumber(value, locale)

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('campaignParticipants.title')}
        subtitle={<EntityNameSubtitle name={campaign.data.name} icon={Users} />}
        action={
          <Link to={`/participations/campaigns/${campaignId}/participants/new`}>
            <Button>
              <Plus className="size-4" />
              {t('campaignParticipants.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="participant-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('campaignParticipants.search')}
        placeholder={t('campaignParticipants.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="benefactor" label={t('contributions.benefactor')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="type" label={t('contributions.type')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="shareCount" label={t('contributions.shareCount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="amount" label={t('contributions.amount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.benefactor.name}</td>
                <td className="px-4 py-3">{t(`contributions.types.${item.type}`)}</td>
                <td className="px-4 py-3">
                  {item.shareCount != null ? n(item.shareCount) : '—'}
                </td>
                <td className="px-4 py-3">{n(item.amount)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/participations/campaigns/${campaignId}/participants/${item.id}`}
                    editTo={`/participations/campaigns/${campaignId}/participants/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('campaignParticipants.confirmDelete'),
                        successMessage: t('campaignParticipants.deleted'),
                        path: `/contributions/${item.id}`,
                        queryKey: ['contributions'],
                        onDeleted: () => {
                          void queryClient.invalidateQueries({ queryKey: ['participation-campaigns'] })
                          void queryClient.invalidateQueries({
                            queryKey: ['participation-campaign', campaignId],
                          })
                        },
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
