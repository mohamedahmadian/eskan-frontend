import { Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
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
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import {
  EVALUATION_EVALUATOR_TYPES,
  EVALUATION_TARGET_TYPES,
  formatPerformanceRank,
  performanceRankLabelKey,
} from '../../lib/evaluations'
import type {
  Evaluation,
  EvaluationCampaign,
  Paginated,
} from '../../types/app'

export function EvaluationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const campaignId = searchParams.get('campaignId') ?? ''
  const evaluatorType = searchParams.get('evaluatorType') ?? ''
  const targetType = searchParams.get('targetType') ?? ''
  const status = searchParams.get('status') ?? ''

  const campaigns = useQuery({
    queryKey: ['evaluation-campaigns', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<EvaluationCampaign>>('/evaluation-campaigns', {
        params: { pageSize: 100 },
      })
      return data.items
    },
  })

  const query = useQuery({
    queryKey: [
      'evaluations',
      'list',
      q,
      campaignId,
      evaluatorType,
      targetType,
      status,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Evaluation>>('/evaluations', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(campaignId ? { campaignId } : {}),
          ...(evaluatorType ? { evaluatorType } : {}),
          ...(targetType ? { targetType } : {}),
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
        title={t('menus.evaluationsList')}
        subtitle={t('evaluations.list.subtitle')}
        action={
          <Link to="/evaluations/submit">
            <Button>{t('evaluations.startNew')}</Button>
          </Link>
        }
      />
      <SearchBar
        inputId="evaluation-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('common.search')}
        placeholder={t('evaluations.list.searchPlaceholder')}
        filtersActive={Boolean(campaignId || evaluatorType || targetType || status)}
        extra={
          <FilterPair>
            <FormField icon={Filter} label={t('evaluations.campaign')} htmlFor="ev-campaign">
              <SearchSelect
                id="ev-campaign"
                value={campaignId}
                placeholder={t('evaluations.allCampaigns')}
                onChange={(next) =>
                  setParams({ campaignId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allCampaigns') },
                  ...(campaigns.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.title,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('evaluations.evaluatorType')} htmlFor="ev-evaluator">
              <SearchSelect
                id="ev-evaluator"
                value={evaluatorType}
                placeholder={t('evaluations.allEvaluatorTypes')}
                onChange={(next) =>
                  setParams({ evaluatorType: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allEvaluatorTypes') },
                  ...EVALUATION_EVALUATOR_TYPES.map((type) => ({
                    value: type,
                    label: t(`evaluations.evaluatorTypes.${type}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('evaluations.targetType')} htmlFor="ev-target">
              <SearchSelect
                id="ev-target"
                value={targetType}
                placeholder={t('evaluations.allTargetTypes')}
                onChange={(next) =>
                  setParams({ targetType: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allTargetTypes') },
                  ...EVALUATION_TARGET_TYPES.map((type) => ({
                    value: type,
                    label: t(`evaluations.targetTypes.${type}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('evaluations.status')} htmlFor="ev-status">
              <SearchSelect
                id="ev-status"
                value={status}
                placeholder={t('evaluations.allStatuses')}
                onChange={(next) =>
                  setParams({ status: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allStatuses') },
                  { value: 'IN_PROGRESS', label: t('evaluations.statuses.IN_PROGRESS') },
                  { value: 'COMPLETED', label: t('evaluations.statuses.COMPLETED') },
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={
          q || campaignId || evaluatorType || targetType || status
            ? t('common.noResults')
            : t('evaluations.list.empty')
        }
        hasRows={rows.length > 0}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line text-start text-ink-600">
              <th className="px-3 py-2 text-start font-medium">{t('evaluations.campaign')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('evaluations.evaluator')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('evaluations.target')}</th>
              <SortableTh
                label={t('evaluations.status')}
                column="status"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.performanceRank')}
                column="performanceRank"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.startedAt')}
                column="startedAt"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-3 py-2 text-start font-medium">{t('evaluations.submittedBy')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const isProxy = item.submittedById !== item.evaluatorId
              return (
                <tr key={item.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-2.5">{item.campaign?.title ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-ink-900">{item.evaluator?.fullName}</div>
                    <div className="text-xs text-ink-500">
                      {t(`evaluations.evaluatorTypes.${item.evaluatorType}`)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-ink-900">
                      {item.targetType === 'HEADQUARTERS'
                        ? t('evaluations.headquarters')
                        : item.target?.fullName ?? '—'}
                    </div>
                    <div className="text-xs text-ink-500">
                      {t(`evaluations.targetTypes.${item.targetType}`)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {t(`evaluations.statuses.${item.status}`)}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.performanceRank != null ? (
                      <div>
                        <div className="font-semibold text-ink-900">
                          {formatPerformanceRank(item.performanceRank, locale)}
                        </div>
                        <div className="text-xs text-ink-500">
                          {t(performanceRankLabelKey(item.performanceRank))}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <DateText value={item.startedAt} withTime />
                  </td>
                  <td className="px-3 py-2.5">
                    <div>{item.submittedBy?.fullName ?? '—'}</div>
                    {isProxy ? (
                      <div className="text-xs text-gold-600">{t('evaluations.proxyBadge')}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <EntityRowActions
                      viewTo={`/evaluations/${item.id}`}
                      onDelete={() =>
                        confirmDelete({
                          message: t('evaluations.confirmDelete'),
                          successMessage: t('evaluations.deleted'),
                          path: `/evaluations/${item.id}`,
                          queryKey: ['evaluations'],
                        })
                      }
                    />
                  </td>
                </tr>
              )
            })}
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
