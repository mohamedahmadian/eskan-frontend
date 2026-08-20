import { CalendarDays, Package, Plus, Store, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  TableCard,
} from '../../components/ui/ListControls'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import {
  formatItemUnit,
  type ItemQuota,
  type ItemQuotaVoucher,
  type ManagedUser,
  type Paginated,
  type Supplier,
} from '../../types/app'
import { VOUCHERS_ADMIN_BASE, voucherDetailPath, voucherEditPath } from './voucher-paths'

export function ItemQuotaVouchersAdminListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const managerId = searchParams.get('accommodationManagerId') ?? ''
  const supplierId = searchParams.get('supplierId') ?? ''
  const quotaId = searchParams.get('quotaId') ?? ''
  const issuedAt = searchParams.get('issuedAt') ?? ''

  const managers = useQuery({
    queryKey: ['users', 'lookup', 'ACCOMMODATION_MANAGER'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'ACCOMMODATION_MANAGER' },
      })
      return data
    },
  })
  const suppliers = useQuery({
    queryKey: ['suppliers', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Supplier[]>('/suppliers')
      return data
    },
  })
  const quotas = useQuery({
    queryKey: ['item-quotas', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ItemQuota[]>('/item-quotas')
      return data
    },
  })
  const query = useQuery({
    queryKey: ['item-quota-vouchers', 'admin', q, managerId, supplierId, quotaId, issuedAt, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ItemQuotaVoucher>>('/item-quota-vouchers', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(managerId ? { accommodationManagerId: managerId } : {}),
          ...(supplierId ? { supplierId } : {}),
          ...(quotaId ? { quotaId } : {}),
          ...(issuedAt ? { issuedAt } : {}),
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(managerId || supplierId || quotaId || issuedAt)
  const emptyMessage =
    q || filtersActive ? t('itemQuotaVouchers.noResults') : t('itemQuotaVouchers.adminEmpty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.voucherManagement')}
        subtitle={t('itemQuotaVouchers.adminSubtitle')}
        action={
          <Link to={`${VOUCHERS_ADMIN_BASE}/new`}>
            <Button>
              <Plus className="size-4" />
              {t('itemQuotaVouchers.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="item-quota-voucher-admin-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('itemQuotaVouchers.search')}
        placeholder={t('itemQuotaVouchers.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair>
            <FormField icon={UserRound} label={t('itemQuotaVouchers.manager')} htmlFor="voucher-manager">
              <SearchSelect
                id="voucher-manager"
                value={managerId}
                placeholder={t('itemQuotaVouchers.allManagers')}
                onChange={(next) =>
                  setParams({ accommodationManagerId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('itemQuotaVouchers.allManagers') },
                  ...(managers.data ?? []).map((manager) => ({
                    value: manager.id,
                    label: manager.fullName,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Store} label={t('itemQuotaVouchers.supplier')} htmlFor="voucher-supplier">
              <SearchSelect
                id="voucher-supplier"
                value={supplierId}
                placeholder={t('itemQuotaVouchers.allSuppliers')}
                onChange={(next) =>
                  setParams({ supplierId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('itemQuotaVouchers.allSuppliers') },
                  ...(suppliers.data ?? []).map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={CalendarDays} label={t('itemQuotaVouchers.issuedAt')} htmlFor="voucher-issued-at">
              <PersianDateField
                id="voucher-issued-at"
                value={issuedAt || undefined}
                onChange={(next) =>
                  setParams({ issuedAt: next || undefined }, { resetPage: true })
                }
              />
            </FormField>
            <FormField icon={Package} label={t('itemQuotaVouchers.item')} htmlFor="voucher-item">
              <SearchSelect
                id="voucher-item"
                value={quotaId}
                placeholder={t('itemQuotaVouchers.allItems')}
                onChange={(next) => setParams({ quotaId: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('itemQuotaVouchers.allItems') },
                  ...(quotas.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.name} — ${formatNumber(item.year, locale)}`,
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
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.code')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.item')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.manager')}</th>
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
                <td className="px-4 py-3">{item.quota.name}</td>
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
                    viewTo={voucherDetailPath(item.id)}
                    editTo={voucherEditPath(item.id)}
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
