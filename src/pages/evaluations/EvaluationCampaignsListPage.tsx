import { Filter, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { EVALUATION_CAMPAIGN_STATUSES } from '../../lib/evaluations'
import { formatNumber } from '../../lib/datetime'
import type { EvaluationCampaign, Paginated } from '../../types/app'

export function EvaluationCampaignsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const status = searchParams.get('status') ?? ''

  const query = useQuery({
    queryKey: ['evaluation-campaigns', 'list', q, status, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<EvaluationCampaign>>('/evaluation-campaigns', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(status ? { status } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.evaluationCampaigns')}
        subtitle={t('evaluations.campaigns.subtitle')}
        action={
          <Link to="/evaluations/campaigns/new">
            <Button>
              <Plus className="size-4" />
              {t('evaluations.campaigns.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="campaign-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('common.search')}
        placeholder={t('evaluations.campaigns.searchPlaceholder')}
        filtersActive={Boolean(status)}
        extra={
          <FilterPair>
            <FormField icon={Filter} label={t('evaluations.campaigns.status')} htmlFor="campaign-status">
              <SearchSelect
                id="campaign-status"
                value={status}
                placeholder={t('evaluations.allStatuses')}
                onChange={(next) =>
                  setParams({ status: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allStatuses') },
                  ...EVALUATION_CAMPAIGN_STATUSES.map((item) => ({
                    value: item,
                    label: t(`evaluations.campaignStatuses.${item}`),
                  })),
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={q || status ? t('common.noResults') : t('evaluations.campaigns.empty')}
        hasRows={rows.length > 0}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line text-start text-ink-600">
              <SortableTh
                label={t('evaluations.campaigns.title')}
                column="title"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.campaigns.startAt')}
                column="startAt"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.campaigns.endAt')}
                column="endAt"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.campaigns.status')}
                column="status"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-3 py-2 text-start font-medium">{t('evaluations.count')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-b border-line/70 last:border-0">
                <td className="px-3 py-2.5 font-medium text-ink-900">{item.title}</td>
                <td className="px-3 py-2.5">
                  <DateText value={item.startAt} />
                </td>
                <td className="px-3 py-2.5">
                  <DateText value={item.endAt} />
                </td>
                <td className="px-3 py-2.5">
                  {t(`evaluations.campaignStatuses.${item.status}`)}
                </td>
                <td className="px-3 py-2.5">
                  {formatNumber(item._count?.evaluations ?? 0, locale)}
                </td>
                <td className="px-3 py-2.5">
                  <EntityRowActions
                    viewTo={`/evaluations/campaigns/${item.id}`}
                    editTo={`/evaluations/campaigns/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('evaluations.campaigns.confirmDelete'),
                        successMessage: t('evaluations.campaigns.deleted'),
                        path: `/evaluation-campaigns/${item.id}`,
                        queryKey: ['evaluation-campaigns'],
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={(next) => setParams({ page: String(next) })}
      />
    </div>
  )
}
