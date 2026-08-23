import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type ItemQuota, type ItemQuotaVoucher, type Paginated } from '../../types/app'

export function ItemQuotaVouchersListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { quotaId } = useParams()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
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
    queryKey: ['item-quota-vouchers', 'list', quotaId, q, page, sortBy, sortDir],
    enabled: Boolean(quotaId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ItemQuotaVoucher>>('/item-quota-vouchers', {
        params: {
          page,
          quotaId,
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
          <Link to={`/logistics/item-quotas/${quotaId}/vouchers/new`}>
            <Button>
              <Plus className="size-4" />
              {t('itemQuotaVouchers.create')}
            </Button>
          </Link>
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
              <SortableTh
                column="code"
                label={t('itemQuotaVouchers.code')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="manager"
                label={t('itemQuotaVouchers.recipient')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="quantity"
                label={t('itemQuotaVouchers.quantity')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="supplier"
                label={t('itemQuotaVouchers.supplier')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="issuedAt"
                label={t('itemQuotaVouchers.issuedAt')}
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
