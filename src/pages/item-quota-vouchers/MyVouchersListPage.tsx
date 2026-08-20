import { CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { EntityRowActions, PaginationBar, SearchBar, TableCard } from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { formatItemUnit, type ItemQuotaVoucher, type Paginated } from '../../types/app'

export function MyVouchersListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)

  const query = useQuery({
    queryKey: ['item-quota-vouchers', 'mine', q, year, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ItemQuotaVoucher>>('/item-quota-vouchers/mine', {
        params: {
          page,
          year: Number(year),
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
  const emptyMessage =
    q || (yearParam && yearParam !== String(currentYear))
      ? t('myVouchers.noResults')
      : t('myVouchers.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('menus.myVouchers')} subtitle={t('myVouchers.subtitle')} />
      <SearchBar
        inputId="my-voucher-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('myVouchers.search')}
        placeholder={t('myVouchers.searchPlaceholder')}
        filtersActive={Boolean(yearParam && yearParam !== String(currentYear))}
        extra={
          <FormField icon={CalendarDays} label={t('itemQuotas.year')} htmlFor="my-voucher-year">
            <SearchSelect
              id="my-voucher-year"
              value={year}
              placeholder={t('itemQuotas.selectYear')}
              onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
              options={persianYearOptions(locale, Number(year))}
            />
          </FormField>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.code')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotaVouchers.item')}</th>
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
                <td className="px-4 py-3">
                  {formatNumber(item.quantity, locale)} {formatItemUnit(item.quota.unit, t)}
                </td>
                <td className="px-4 py-3">{item.supplierName}</td>
                <td className="px-4 py-3">
                  <DateText value={item.issuedAt} withTime />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions viewTo={`/logistics/my-vouchers/${item.id}`} />
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
