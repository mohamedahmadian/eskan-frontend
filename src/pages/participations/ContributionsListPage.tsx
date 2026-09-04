import { Filter, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  FilterPair,
  SortableTh,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, formatGroupedQuantity } from '../../lib/datetime'
import type {
  Contribution,
  ContributionGood,
  ContributionType,
  Paginated,
  ParticipationCampaign,
} from '../../types/app'

const typeBadgeTone: Record<ContributionType, { wrap: string; dot: string }> = {
  CASH: { wrap: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  IN_KIND: { wrap: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
}

function ContributionTypeBadge({ type }: { type: ContributionType }) {
  const { t } = useTranslation()
  const tone = typeBadgeTone[type]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.wrap}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
      {t(`contributions.types.${type}`)}
    </span>
  )
}

export function ContributionsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const [exporting, setExporting] = useState(false)
  const type = searchParams.get('type') ?? ''
  const goodsId = searchParams.get('goodsId') ?? ''
  const campaignId = searchParams.get('campaignId') ?? ''

  const goods = useQuery({
    queryKey: ['contribution-goods', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ContributionGood[]>('/contribution-goods')
      return data
    },
  })

  const campaigns = useQuery({
    queryKey: ['participation-campaigns', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign[]>('/participation-campaigns')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['contributions', 'list', q, type, goodsId, campaignId, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Contribution>>('/contributions', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(type ? { type } : {}),
          ...(goodsId ? { goodsId } : {}),
          ...(campaignId ? { campaignId } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  async function downloadExcel() {
    setExporting(true)
    try {
      const { data } = await api.get<Blob>('/contributions/export', {
        params: {
          ...(term.trim() || q ? { q: term.trim() || q } : {}),
          ...(type ? { type } : {}),
          ...(goodsId ? { goodsId } : {}),
          ...(campaignId ? { campaignId } : {}),
          ...sortParams,
        },
        responseType: 'blob',
      })
      const blob = data instanceof Blob ? data : new Blob([data])
      if (blob.type.includes('json')) {
        const text = await blob.text()
        const parsed = JSON.parse(text) as { message?: string }
        toast.error(parsed.message || t('common.error'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'contributions.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('contributions.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(false)
    }
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q || type || goodsId || campaignId ? t('contributions.noResults') : t('contributions.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.contributions')}
        subtitle={t('contributions.subtitle')}
        action={
          <Link to="/participations/contributions/new">
            <Button>
              <Plus className="size-4" />
              {t('contributions.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="contribution-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('contributions.search')}
        placeholder={t('contributions.searchPlaceholder')}
        filtersActive={Boolean(type || goodsId || campaignId)}
        extra={
          <FilterPair columns={3}>
            <FormField icon={Filter} label={t('contributions.type')} htmlFor="contribution-type">
              <SearchSelect
                id="contribution-type"
                value={type}
                placeholder={t('contributions.allTypes')}
                onChange={(next) =>
                  setParams({ type: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('contributions.allTypes') },
                  { value: 'CASH', label: t('contributions.types.CASH') },
                  { value: 'IN_KIND', label: t('contributions.types.IN_KIND') },
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('contributions.goods')} htmlFor="contribution-goods">
              <SearchSelect
                id="contribution-goods"
                value={goodsId}
                placeholder={t('contributions.allGoods')}
                onChange={(next) =>
                  setParams({ goodsId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('contributions.allGoods') },
                  ...(goods.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('contributions.campaign')} htmlFor="contribution-campaign">
              <SearchSelect
                id="contribution-campaign"
                value={campaignId}
                placeholder={t('contributions.allCampaigns')}
                onChange={(next) =>
                  setParams({ campaignId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('contributions.allCampaigns') },
                  ...(campaigns.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="benefactor" label={t('contributions.benefactor')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="type" label={t('contributions.type')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="amount" label={t('contributions.amount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="shareCount" label={t('contributions.shareCount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="campaign" label={t('contributions.campaign')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="goods" label={t('contributions.goods')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="quantity" label={t('contributions.quantity')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="createdAt" label={t('common.date')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.benefactor.name}</td>
                <td className="px-4 py-3">
                  <ContributionTypeBadge type={item.type} />
                </td>
                <td className="px-4 py-3">{formatGroupedNumber(item.amount, locale)}</td>
                <td className="px-4 py-3">
                  {item.shareCount != null ? formatGroupedNumber(item.shareCount, locale) : '—'}
                </td>
                <td className="px-4 py-3">{item.campaign?.name || '—'}</td>
                <td className="px-4 py-3">{item.goods?.name || '—'}</td>
                <td className="px-4 py-3">
                  {item.quantity != null
                    ? `${formatGroupedQuantity(item.quantity, locale)}${item.unit ? ` ${item.unit.name}` : ''}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <DateText value={item.createdAt} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/participations/contributions/${item.id}`}
                    editTo={`/participations/contributions/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('contributions.confirmDelete'),
                        successMessage: t('contributions.deleted'),
                        path: `/contributions/${item.id}`,
                        queryKey: ['contributions'],
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
          startExtra={
            <Button type="button" variant="ghost" onClick={() => void downloadExcel()} disabled={exporting}>
              {exporting ? t('contributions.downloadingExcel') : t('contributions.downloadExcel')}
            </Button>
          }
        />
      ) : null}
    </div>
  )
}
