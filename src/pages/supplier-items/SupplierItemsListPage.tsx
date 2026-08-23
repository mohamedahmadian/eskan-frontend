import { CalendarDays, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { formatItemUnit, type Paginated, type Supplier, type SupplierItem } from '../../types/app'

export function SupplierItemsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { supplierId } = useParams()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)

  const supplier = useQuery({
    queryKey: ['supplier', supplierId],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/suppliers/${supplierId}`)
      return data
    },
  })

  const query = useQuery({
    queryKey: ['supplier-items', 'list', supplierId, q, year, page, sortBy, sortDir],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<SupplierItem>>('/supplier-items', {
        params: {
          page,
          supplierId,
          year: Number(year),
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
  const emptyMessage = q || yearParam ? t('supplierItems.noResults') : t('supplierItems.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('supplierItems.title')}
        subtitle={supplier.data?.name ?? t('supplierItems.subtitle')}
        action={
          <Link to={`/logistics/suppliers/${supplierId}/items/new`}>
            <Button>
              <Plus className="size-4" />
              {t('supplierItems.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="supplier-item-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('supplierItems.search')}
        placeholder={t('supplierItems.searchPlaceholder')}
        filtersActive={Boolean(yearParam && yearParam !== String(currentYear))}
        extra={
          <FormField icon={CalendarDays} label={t('supplierItems.year')} htmlFor="supplier-item-year">
            <SearchSelect
              id="supplier-item-year"
              value={year}
              placeholder={t('supplierItems.selectYear')}
              onChange={(next) =>
                setParams({ year: next || undefined }, { resetPage: true })
              }
              options={persianYearOptions(locale, Number(year))}
            />
          </FormField>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('supplierItems.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="unit" label={t('supplierItems.unit')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="quantity" label={t('supplierItems.quantity')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('supplierItems.remainingQuantity')}</th>
              <SortableTh
                column="deliveryDate"
                label={t('supplierItems.deliveryDate')}
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
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{formatItemUnit(item.unit, t)}</td>
                <td className="px-4 py-3">{formatNumber(item.quantity, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.remainingQuantity, locale)}</td>
                <td className="px-4 py-3">
                  <DateText value={item.deliveryDate} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/logistics/suppliers/${supplierId}/items/${item.id}`}
                    editTo={`/logistics/suppliers/${supplierId}/items/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('supplierItems.confirmDelete'),
                        successMessage: t('supplierItems.deleted'),
                        path: `/supplier-items/${item.id}`,
                        queryKey: ['supplier-items'],
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
