import { Banknote, CalendarDays, Filter, MessageSquare, Plus } from 'lucide-react'
import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SmsPreviewModal } from '../../components/sms/SmsPreviewModal'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useSendSms } from '../../hooks/useSendSms'
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
import { buildIceVoucherSmsBody } from './iceVoucherSms'

export function IceVouchersListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const sms = useSendSms()
  const [smsOpen, setSmsOpen] = useState(false)
  const [smsPhone, setSmsPhone] = useState('')
  const [smsBody, setSmsBody] = useState('')
  const [sending, setSending] = useState(false)
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)
  const status = (searchParams.get('status') ?? '') as IceVoucherStatus | ''
  const paymentStatus = (searchParams.get('paymentStatus') ?? '') as IceVoucherPaymentStatus | ''

  const query = useQuery({
    queryKey: ['ice-vouchers', 'list', q, year, status, paymentStatus, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<IceVoucher>>('/ice-vouchers', {
        params: {
          page,
          year: Number(year),
          ...(q ? { q } : {}),
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
        },
      })
      return data
    },
  })

  const statsQuery = useQuery({
    queryKey: ['ice-vouchers', 'stats', year],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherStats>('/ice-vouchers/stats', {
        params: { year: Number(year) },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  function openSms(voucher: IceVoucher) {
    setSmsPhone(voucher.accommodationManager.phone ?? '')
    setSmsBody(buildIceVoucherSmsBody(voucher, locale, t))
    setSmsOpen(true)
  }

  async function sendSms() {
    const phone = smsPhone.trim()
    const body = smsBody.trim()
    if (!phone) {
      toast.error(t('iceVouchers.smsPhoneRequired'))
      return
    }
    if (!body) {
      toast.error(t('iceVouchers.smsBodyRequired'))
      return
    }
    setSending(true)
    try {
      await sms.mutateAsync({ phone, body })
      toast.success(t('sms.queued'))
      setSmsOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSending(false)
    }
  }

  const rows = query.data?.items ?? []
  const emptyMessage =
    q || (yearParam && yearParam !== String(currentYear)) || status || paymentStatus
      ? t('iceVouchers.noResults')
      : t('iceVouchers.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.iceVouchers')}
        subtitle={t('iceVouchers.subtitle')}
        action={
          <Link to="/logistics/ice-vouchers/new">
            <Button>
              <Plus className="size-4" />
              {t('iceVouchers.create')}
            </Button>
          </Link>
        }
      />
      <IceVoucherStatsBar stats={statsQuery.data} locale={locale} />
      <SearchBar
        inputId="ice-voucher-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('iceVouchers.search')}
        placeholder={t('iceVouchers.searchPlaceholder')}
        filtersActive={Boolean((yearParam && yearParam !== String(currentYear)) || status || paymentStatus)}
        extra={
          <FilterPair columns={3}>
            <FormField icon={CalendarDays} label={t('iceVoucherReports.year')} htmlFor="ice-voucher-year">
              <SearchSelect
                id="ice-voucher-year"
                value={year}
                placeholder={t('iceVoucherReports.selectYear')}
                onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                options={persianYearOptions(locale, Number(year))}
              />
            </FormField>
            <FormField icon={Filter} label={t('iceVouchers.status')} htmlFor="ice-voucher-status">
              <SearchSelect
                id="ice-voucher-status"
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
            <FormField icon={Banknote} label={t('iceVouchers.paymentStatus')} htmlFor="ice-voucher-payment">
              <SearchSelect
                id="ice-voucher-payment"
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
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.code')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.accommodation')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.manager')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.moldCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.totalCost')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.requestedAt')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.status')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('iceVouchers.paymentStatus')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3" dir="ltr">
                  {item.code}
                </td>
                <td className="px-4 py-3">{item.accommodation.name}</td>
                <td className="px-4 py-3">{item.accommodationManager.fullName}</td>
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
                    viewTo={`/logistics/ice-vouchers/${item.id}`}
                    extra={
                      <Button type="button" variant="ghost" onClick={() => openSms(item)}>
                        <MessageSquare className="size-4" aria-hidden />
                        {t('iceVouchers.sms')}
                      </Button>
                    }
                    editTo={`/logistics/ice-vouchers/${item.id}/edit`}
                    onDelete={
                      item.status !== 'APPROVED'
                        ? () =>
                            confirmDelete({
                              message: t('iceVouchers.confirmDelete'),
                              successMessage: t('iceVouchers.deleted'),
                              path: `/ice-vouchers/${item.id}`,
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
      {smsOpen ? (
        <SmsPreviewModal
          title={t('iceVouchers.smsPreviewTitle')}
          phone={smsPhone}
          body={smsBody}
          sending={sending}
          onPhoneChange={setSmsPhone}
          onBodyChange={setSmsBody}
          onClose={() => setSmsOpen(false)}
          onSend={sendSms}
        />
      ) : null}
    </div>
  )
}
