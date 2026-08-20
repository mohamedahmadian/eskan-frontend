import { CalendarDays, Filter, Plus, Undo2 } from 'lucide-react'
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
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { formatItemUnit, type AccommodationLoan, type ManagedUser, type Paginated } from '../../types/app'

export function AccommodationLoansListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const currentYear = currentPersianYear()
  const yearParam = searchParams.get('year')
  const year = yearParam || String(currentYear)
  const managerId = searchParams.get('accommodationManagerId') ?? ''
  const returnStatus = searchParams.get('returnStatus') ?? ''

  const managers = useQuery({
    queryKey: ['users', 'lookup', 'ACCOMMODATION_MANAGER'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'ACCOMMODATION_MANAGER' },
      })
      return data
    },
  })

  const query = useQuery({
    queryKey: ['accommodation-loans', 'list', q, year, managerId, returnStatus, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AccommodationLoan>>('/accommodation-loans', {
        params: {
          page,
          year: Number(year),
          ...(q ? { q } : {}),
          ...(managerId ? { accommodationManagerId: managerId } : {}),
          ...(returnStatus ? { returnStatus } : {}),
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
    q || yearParam || managerId || returnStatus
      ? t('accommodationLoans.noResults')
      : t('accommodationLoans.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.loanManagement')}
        subtitle={t('accommodationLoans.subtitle')}
        action={
          <Link to="/logistics/loans/new">
            <Button>
              <Plus className="size-4" />
              {t('accommodationLoans.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="accommodation-loan-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('accommodationLoans.search')}
        placeholder={t('accommodationLoans.searchPlaceholder')}
        filtersActive={Boolean(
          (yearParam && yearParam !== String(currentYear)) || managerId || returnStatus,
        )}
        extra={
          <FilterPair columns={3}>
            <FormField icon={CalendarDays} label={t('supplierItems.year')} htmlFor="loan-year">
              <SearchSelect
                id="loan-year"
                value={year}
                placeholder={t('supplierItems.selectYear')}
                onChange={(next) =>
                  setParams({ year: next || undefined }, { resetPage: true })
                }
                options={persianYearOptions(locale, Number(year))}
              />
            </FormField>
            <FormField icon={Filter} label={t('accommodationLoans.manager')} htmlFor="loan-manager">
              <SearchSelect
                id="loan-manager"
                value={managerId}
                placeholder={t('accommodationLoans.allManagers')}
                onChange={(next) =>
                  setParams(
                    { accommodationManagerId: next || undefined },
                    { resetPage: true },
                  )
                }
                options={[
                  { value: '', label: t('accommodationLoans.allManagers') },
                  ...(managers.data ?? []).map((manager) => ({
                    value: manager.id,
                    label: manager.fullName,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Undo2} label={t('accommodationLoans.returnStatus')} htmlFor="loan-return-status">
              <SearchSelect
                id="loan-return-status"
                value={returnStatus}
                placeholder={t('accommodationLoans.allReturnStatuses')}
                onChange={(next) =>
                  setParams({ returnStatus: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('accommodationLoans.allReturnStatuses') },
                  { value: 'full', label: t('accommodationLoans.returnFull') },
                  { value: 'partial', label: t('accommodationLoans.returnPartial') },
                  { value: 'none', label: t('accommodationLoans.returnNone') },
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
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.item')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.manager')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.quantity')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.returnedQuantity')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.shortage')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodationLoans.deliveryDate')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.supplierItem.name}</td>
                <td className="px-4 py-3">{item.accommodationManager.fullName}</td>
                <td className="px-4 py-3">
                  {formatNumber(item.quantity, locale)} {formatItemUnit(item.supplierItem.unit, t)}
                </td>
                <td className="px-4 py-3">
                  {item.returnedQuantity == null
                    ? '—'
                    : `${formatNumber(item.returnedQuantity, locale)} ${formatItemUnit(item.supplierItem.unit, t)}`}
                </td>
                <td className="px-4 py-3">
                  {item.shortage == null
                    ? '—'
                    : `${formatNumber(item.shortage, locale)} ${formatItemUnit(item.supplierItem.unit, t)}`}
                </td>
                <td className="px-4 py-3">
                  <DateText value={item.deliveryDate} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/logistics/loans/${item.id}`}
                    editTo={`/logistics/loans/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('accommodationLoans.confirmDelete'),
                        successMessage: t('accommodationLoans.deleted'),
                        path: `/accommodation-loans/${item.id}`,
                        queryKey: ['accommodation-loans'],
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
