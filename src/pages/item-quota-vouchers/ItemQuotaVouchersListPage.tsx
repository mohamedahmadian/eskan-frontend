import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { EntityRowActions, PaginationBar, SearchBar, TableCard } from '../../components/ui/ListControls'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type ItemQuota, type ItemQuotaVoucher, type Paginated } from '../../types/app'

export function ItemQuotaVouchersListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { quotaId } = useParams()
  const { q, page, term, setTerm, setPage, setParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()

  const quota = useQuery({
    queryKey: ['item-quota', quotaId],
    enabled: Boolean(quotaId),
    queryFn: async () => {
      const { data } = await api.get<ItemQuota>(`/item-quotas/${quotaId}`)
      return data
    },
  })

  const query = useQuery({
    queryKey: ['item-quota-vouchers', 'list', quotaId, q, page],
    enabled: Boolean(quotaId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ItemQuotaVoucher>>('/item-quota-vouchers', {
        params: {
          page,
          quotaId,
          ...(q ? { q } : {}),
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q ? t('itemQuotaVouchers.noResults') : t('itemQuotaVouchers.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('itemQuotaVouchers.title')}
        subtitle={
          quota.data
            ? `${quota.data.name} — ${formatNumber(quota.data.remainingQuantity, locale)} ${formatItemUnit(quota.data.unit, t)}`
            : t('itemQuotaVouchers.subtitle')
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/logistics/item-quotas/${quotaId}`}
              className="text-sm text-teal-700 hover:underline"
            >
              {t('itemQuotaVouchers.backToQuota')}
            </Link>
            <Link to={`/logistics/item-quotas/${quotaId}/vouchers/new`}>
              <Button>
                <Plus className="size-4" />
                {t('itemQuotaVouchers.create')}
              </Button>
            </Link>
          </div>
        }
      />
      <SearchBar
        inputId="item-quota-voucher-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('itemQuotaVouchers.search')}
        placeholder={t('itemQuotaVouchers.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.code')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.recipient')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.quantity')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.supplier')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.issuedAt')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3" dir="ltr">
                  {item.code}
                </td>
                <td className="px-4 py-3">{item.accommodationManager.fullName}</td>
                <td className="px-4 py-3">
                  {formatNumber(item.quantity, locale)} {formatItemUnit(item.quota.unit, t)}
                </td>
                <td className="px-4 py-3">{item.supplierName}</td>
                <td className="px-4 py-3">
                  <DateText value={item.issuedAt} withTime />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/logistics/item-quotas/${quotaId}/vouchers/${item.id}`}
                    editTo={`/logistics/item-quotas/${quotaId}/vouchers/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('itemQuotaVouchers.confirmDelete'),
                        successMessage: t('itemQuotaVouchers.deleted'),
                        path: `/item-quota-vouchers/${item.id}`,
                        queryKey: ['item-quota-vouchers'],
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
