import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import type { BankAccount, Paginated } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function BankAccountsListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['bank-accounts', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<BankAccount>>('/bank-accounts', {
        params: {
          page,
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
  const emptyMessage = q ? t('bankAccounts.noResults') : t('bankAccounts.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.bankAccounts')}
        subtitle={t('bankAccounts.subtitle')}
        action={
          <Link to="/participations/bank-accounts/new">
            <Button>
              <Plus className="size-4" />
              {t('bankAccounts.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="bank-account-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('bankAccounts.search')}
        placeholder={t('bankAccounts.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="bankName" label={t('bankAccounts.bankName')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="accountNumber" label={t('bankAccounts.accountNumber')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="cardNumber" label={t('bankAccounts.cardNumber')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="iban" label={t('bankAccounts.iban')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="isActive" label={t('geo.isActive')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.bankName}</td>
                <td className="px-4 py-3">
                  <CopyableDigits value={item.accountNumber} />
                </td>
                <td className="px-4 py-3">
                  {item.cardNumber ? <CopyableDigits value={item.cardNumber} /> : '—'}
                </td>
                <td className="px-4 py-3">
                  <CopyableDigits value={item.iban} />
                </td>
                <td className="px-4 py-3">
                  <GeoStatus active={item.isActive} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/participations/bank-accounts/${item.id}`}
                    editTo={`/participations/bank-accounts/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('bankAccounts.confirmDelete'),
                        successMessage: t('bankAccounts.deleted'),
                        path: `/bank-accounts/${item.id}`,
                        queryKey: ['bank-accounts'],
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
