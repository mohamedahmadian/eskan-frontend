import { Banknote, CalendarDays, Coins, Filter, Plus, ScrollText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, cardClassName, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatGroupedNumber, formatNumber, persianYearOptions } from '../../lib/datetime'
import type {
  IceVoucher,
  IceVoucherPaymentStatus,
  IceVoucherStats,
  IceVoucherStatus,
  Paginated,
} from '../../types/app'
import { IceVoucherPaymentBadge, IceVoucherStatusBadge } from './IceVoucherStatusBadge'
import { IceVoucherStatsBar } from './IceVoucherStatsBar'

function canPay(item: IceVoucher) {
  return item.paymentStatus === 'UNPAID' && item.status !== 'REJECTED'
}

export function MyIceVouchersListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)
  const status = (searchParams.get('status') ?? '') as IceVoucherStatus | ''
  const paymentStatus = (searchParams.get('paymentStatus') ?? '') as IceVoucherPaymentStatus | ''
  const [selected, setSelected] = useState<Record<string, number>>({})

  const query = useQuery({
    queryKey: ['ice-vouchers', 'mine', q, year, status, paymentStatus, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<IceVoucher>>('/ice-vouchers/mine', {
        params: {
          page,
          year: Number(year),
          ...(q ? { q } : {}),
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const statsQuery = useQuery({
    queryKey: ['ice-vouchers', 'mine', 'stats', year],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherStats>('/ice-vouchers/mine/stats', {
        params: { year: Number(year) },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.items ?? []
  const payableRows = useMemo(() => rows.filter(canPay), [rows])
  const selectedIds = Object.keys(selected)
  const selectedCount = selectedIds.length
  const selectedAmount = Object.values(selected).reduce((sum, amount) => sum + amount, 0)
  const allPayableSelected =
    payableRows.length > 0 && payableRows.every((item) => item.id in selected)

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  function toggleOne(item: IceVoucher, checked: boolean) {
    setSelected((current) => {
      if (checked) {
        if (current[item.id] === item.totalCost) return current
        return { ...current, [item.id]: item.totalCost }
      }
      if (!(item.id in current)) return current
      const next = { ...current }
      delete next[item.id]
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected((current) => {
      if (checked) {
        const next = { ...current }
        for (const item of payableRows) next[item.id] = item.totalCost
        return next
      }
      const payableIds = new Set(payableRows.map((item) => item.id))
      return Object.fromEntries(Object.entries(current).filter(([id]) => !payableIds.has(id)))
    })
  }

  const pay = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.post<{ totalCost: number }>('/ice-vouchers/mine/pay', { ids })
      return data
    },
    onSuccess: async () => {
      setSelected({})
      await queryClient.invalidateQueries({ queryKey: ['ice-vouchers'] })
      toast.success(t('iceVouchers.paidSuccess'))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function onPay() {
    if (!selectedCount) {
      toast.info(t('iceVouchers.selectUnpaidFirst'))
      return
    }
    pay.mutate(selectedIds)
  }

  const emptyMessage =
    q || (yearParam && yearParam !== String(currentYear)) || status || paymentStatus
      ? t('myIceVouchers.noResults')
      : t('myIceVouchers.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.myIceVouchers')}
        subtitle={t('myIceVouchers.subtitle')}
        action={
          <Link to="/logistics/my-ice-vouchers/new">
            <Button>
              <Plus className="size-4" />
              {t('iceVouchers.create')}
            </Button>
          </Link>
        }
      />
      <IceVoucherStatsBar
        stats={statsQuery.data}
        locale={locale}
        onPayAll={() => {
          const items = statsQuery.data?.payableUnpaid ?? []
          if (!items.length) {
            toast.info(t('iceVouchers.selectUnpaidFirst'))
            return
          }
          setSelected(Object.fromEntries(items.map((item) => [item.id, item.totalCost])))
        }}
      />
      <SearchBar
        inputId="my-ice-voucher-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('myIceVouchers.search')}
        placeholder={t('myIceVouchers.searchPlaceholder')}
        filtersActive={Boolean(
          (yearParam && yearParam !== String(currentYear)) || status || paymentStatus,
        )}
        extra={
          <FilterPair columns={3}>
            <FormField icon={CalendarDays} label={t('iceVoucherReports.year')} htmlFor="my-ice-voucher-year">
              <SearchSelect
                id="my-ice-voucher-year"
                value={year}
                placeholder={t('iceVoucherReports.selectYear')}
                onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                options={persianYearOptions(locale, Number(year))}
              />
            </FormField>
            <FormField icon={Filter} label={t('iceVouchers.status')} htmlFor="my-ice-voucher-status">
              <SearchSelect
                id="my-ice-voucher-status"
                value={status}
                placeholder={t('iceVouchers.allStatuses')}
                onChange={(next) => setParams({ status: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('iceVouchers.allStatuses') },
                  { value: 'PENDING', label: t('iceVouchers.statusPending') },
                  { value: 'APPROVED', label: t('iceVouchers.statusApproved') },
                  { value: 'REJECTED', label: t('iceVouchers.statusRejected') },
                ]}
              />
            </FormField>
            <FormField
              icon={Banknote}
              label={t('iceVouchers.paymentStatus')}
              htmlFor="my-ice-voucher-payment"
            >
              <SearchSelect
                id="my-ice-voucher-payment"
                value={paymentStatus}
                placeholder={t('iceVouchers.allPaymentStatuses')}
                onChange={(next) => setParams({ paymentStatus: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('iceVouchers.allPaymentStatuses') },
                  { value: 'UNPAID', label: t('iceVouchers.unpaid') },
                  { value: 'PAID', label: t('iceVouchers.paid') },
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      {selectedCount > 0 ? (
        <section className={`${cardClassName} mb-4 overflow-hidden`} aria-live="polite">
          <div className="h-1 bg-gradient-to-e from-gold-400 via-teal-400 to-teal-500" aria-hidden />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <ScrollText className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-ink-500">{t('iceVouchers.selectedCount')}</p>
                <p className="mt-1 text-2xl font-semibold text-ink-900">
                  {formatNumber(selectedCount, locale)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
                <Coins className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-ink-500">{t('iceVouchers.selectedAmount')}</p>
                <p className="mt-1 text-2xl font-semibold text-ink-900">
                  {formatGroupedNumber(selectedAmount, locale)} {t('logisticsSettings.toman')}
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="sm:ms-auto"
              onClick={onPay}
              disabled={pay.isPending}
            >
              <Banknote className="size-4" aria-hidden />
              {t('iceVouchers.pay')}
            </Button>
          </div>
        </section>
      ) : null}
      <TableCard
        loading={query.isLoading}
        empty={emptyMessage}
        hasRows={rows.length > 0}
        rowClick={selectedCount === 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-2 py-3 text-start font-medium">
                <CheckboxField
                  id="select-all-unpaid"
                  compact
                  checked={allPayableSelected}
                  disabled={payableRows.length === 0}
                  onChange={toggleAll}
                  label={t('iceVouchers.selectAllUnpaid')}
                />
              </th>
              <SortableTh
                column="code"
                label={t('iceVouchers.code')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="accommodation"
                label={t('iceVouchers.accommodation')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="moldCount"
                label={t('iceVouchers.moldCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="totalCost"
                label={t('iceVouchers.totalCost')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="requestedAt"
                label={t('iceVouchers.requestedAt')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="status"
                label={t('iceVouchers.status')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="paymentStatus"
                label={t('iceVouchers.paymentStatus')}
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
                <td className="px-2 py-3">
                  {canPay(item) ? (
                    <CheckboxField
                      id={`pay-${item.id}`}
                      compact
                      checked={item.id in selected}
                      onChange={(checked) => toggleOne(item, checked)}
                      label={t('iceVouchers.selectUnpaid')}
                    />
                  ) : (
                    <span className="inline-block size-9" />
                  )}
                </td>
                <td className="px-4 py-3" dir="ltr">
                  {item.code}
                </td>
                <td className="px-4 py-3">{item.accommodation.name}</td>
                <td className="px-4 py-3">{formatNumber(item.moldCount, locale)}</td>
                <td className="px-4 py-3">
                  {formatGroupedNumber(item.totalCost, locale)} {t('logisticsSettings.toman')}
                </td>
                <td className="px-4 py-3">
                  <DateText value={item.requestedAt} />
                </td>
                <td className="px-4 py-3">
                  <IceVoucherStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <IceVoucherPaymentBadge status={item.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/logistics/my-ice-vouchers/${item.id}`}
                    onDelete={
                      item.status === 'PENDING'
                        ? () =>
                            confirmDelete({
                              message: t('iceVouchers.confirmDelete'),
                              successMessage: t('iceVouchers.deleted'),
                              path: `/ice-vouchers/mine/${item.id}`,
                              queryKey: ['ice-vouchers'],
                            })
                        : undefined
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
