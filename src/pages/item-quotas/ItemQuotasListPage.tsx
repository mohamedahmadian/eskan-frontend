import { CalendarDays, Filter, Plus, Ticket } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
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
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { formatItemUnit, type ItemQuota, type Paginated, type Supplier } from '../../types/app'

export function ItemQuotasListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)
  const supplierId = searchParams.get('supplierId') ?? ''

  const suppliers = useQuery({
    queryKey: ['suppliers', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Supplier[]>('/suppliers')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['item-quotas', 'list', q, year, supplierId, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ItemQuota>>('/item-quotas', {
        params: {
          page,
          year: Number(year),
          ...(q ? { q } : {}),
          ...(supplierId ? { supplierId } : {}),
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
    q || yearParam || supplierId ? t('itemQuotas.noResults') : t('itemQuotas.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.itemQuotas')}
        subtitle={t('itemQuotas.subtitle')}
        action={
          <Link to="/logistics/item-quotas/new">
            <Button>
              <Plus className="size-4" />
              {t('itemQuotas.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="item-quota-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('itemQuotas.search')}
        placeholder={t('itemQuotas.searchPlaceholder')}
        filtersActive={Boolean((yearParam && yearParam !== String(currentYear)) || supplierId)}
        extra={
          <FilterPair>
            <FormField icon={CalendarDays} label={t('itemQuotas.year')} htmlFor="quota-year">
              <SearchSelect
                id="quota-year"
                value={year}
                placeholder={t('itemQuotas.selectYear')}
                onChange={(next) =>
                  setParams({ year: next || undefined }, { resetPage: true })
                }
                options={persianYearOptions(locale, Number(year))}
              />
            </FormField>
            <FormField icon={Filter} label={t('itemQuotas.supplier')} htmlFor="quota-supplier">
              <SearchSelect
                id="quota-supplier"
                value={supplierId}
                placeholder={t('itemQuotas.allSuppliers')}
                onChange={(next) =>
                  setParams({ supplierId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('itemQuotas.allSuppliers') },
                  ...(suppliers.data ?? []).map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
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
              <SortableTh
                column="name"
                label={t('itemQuotas.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="year"
                label={t('itemQuotas.year')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="quantity"
                label={t('itemQuotas.quantity')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('itemQuotas.remainingQuantity')}</th>
              <SortableTh
                column="supplier"
                label={t('itemQuotas.supplier')}
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
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
                <td className="px-4 py-3">
                  {formatNumber(item.quantity, locale)} {formatItemUnit(item.unit, t)}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(item.remainingQuantity, locale)} {formatItemUnit(item.unit, t)}
                </td>
                <td className="px-4 py-3">
                  {item.supplier?.name ?? t('itemQuotas.unspecifiedSupplier')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EntityRowActions
                      viewTo={`/logistics/item-quotas/${item.id}`}
                      editTo={`/logistics/item-quotas/${item.id}/edit`}
                      onDelete={() =>
                        confirmDelete({
                          message: t('itemQuotas.confirmDelete'),
                          successMessage: t('itemQuotas.deleted'),
                          path: `/item-quotas/${item.id}`,
                          queryKey: ['item-quotas'],
                        })
                      }
                    />
                    <Link to={`/logistics/item-quotas/${item.id}/vouchers`}>
                      <Button type="button" variant="soft">
                        <Ticket className="size-4" aria-hidden />
                        {t('itemQuotaVouchers.manage')}
                      </Button>
                    </Link>
                  </div>
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
