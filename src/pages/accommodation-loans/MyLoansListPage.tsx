import { CalendarDays, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import type { AccommodationLoan, Paginated } from '../../types/app'

export function MyLoansListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)
  const status = searchParams.get('status') ?? ''

  const query = useQuery({
    queryKey: ['accommodation-loans', 'mine', q, year, status, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AccommodationLoan>>('/accommodation-loans/mine', {
        params: {
          page,
          year: Number(year),
          ...(q ? { q } : {}),
          ...(status ? { status } : {}),
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
  const emptyMessage =
    q || (yearParam && yearParam !== String(currentYear)) || status
      ? t('myLoans.noResults')
      : t('myLoans.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('menus.myLoans')} subtitle={t('myLoans.subtitle')} />
      <SearchBar
        inputId="my-loan-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('myLoans.search')}
        placeholder={t('myLoans.searchPlaceholder')}
        filtersActive={Boolean((yearParam && yearParam !== String(currentYear)) || status)}
        extra={
          <FilterPair>
            <FormField icon={CalendarDays} label={t('supplierItems.year')} htmlFor="my-loan-year">
              <SearchSelect
                id="my-loan-year"
                value={year}
                placeholder={t('supplierItems.selectYear')}
                onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                options={persianYearOptions(locale, Number(year))}
              />
            </FormField>
            <FormField icon={Filter} label={t('myLoans.status')} htmlFor="my-loan-status">
              <SearchSelect
                id="my-loan-status"
                value={status}
                placeholder={t('myLoans.allStatuses')}
                onChange={(next) => setParams({ status: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('myLoans.allStatuses') },
                  { value: 'open', label: t('myLoans.inCustody') },
                  { value: 'returned', label: t('myLoans.returned') },
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
              <SortableTh
                column="item"
                label={t('accommodationLoans.item')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="supplier"
                label={t('suppliers.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="quantity"
                label={t('accommodationLoans.quantity')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="returnedQuantity"
                label={t('accommodationLoans.returnedQuantity')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.shortage')}</th>
              <SortableTh
                column="deliveryDate"
                label={t('accommodationLoans.deliveryDate')}
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
                <td className="px-4 py-3">{item.supplierItem.name}</td>
                <td className="px-4 py-3">{item.supplierItem.supplier.name}</td>
                <td className="px-4 py-3">
                  {formatNumber(item.quantity, locale)} {item.supplierItem.unit}
                </td>
                <td className="px-4 py-3">
                  {item.returnedQuantity == null
                    ? '—'
                    : `${formatNumber(item.returnedQuantity, locale)} ${item.supplierItem.unit}`}
                </td>
                <td className="px-4 py-3">
                  {item.shortage == null
                    ? '—'
                    : `${formatNumber(item.shortage, locale)} ${item.supplierItem.unit}`}
                </td>
                <td className="px-4 py-3">
                  <DateText value={item.deliveryDate} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions viewTo={`/logistics/my-loans/${item.id}`} />
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
