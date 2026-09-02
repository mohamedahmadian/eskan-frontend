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
import type { CryptoWallet, Paginated } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function CryptoWalletsListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['crypto-wallets', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<CryptoWallet>>('/crypto-wallets', {
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
  const emptyMessage = q ? t('cryptoWallets.noResults') : t('cryptoWallets.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.cryptoWallets')}
        subtitle={t('cryptoWallets.subtitle')}
        action={
          <Link to="/participations/crypto-wallets/new">
            <Button>
              <Plus className="size-4" />
              {t('cryptoWallets.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="crypto-wallet-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('cryptoWallets.search')}
        placeholder={t('cryptoWallets.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="label" label={t('cryptoWallets.label')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="currency" label={t('cryptoWallets.currency')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="network" label={t('cryptoWallets.network')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="address" label={t('cryptoWallets.address')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="isActive" label={t('geo.isActive')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.label}</td>
                <td className="px-4 py-3">{t(`cryptoCurrencies.${item.currency}`, { defaultValue: item.currency })}</td>
                <td className="px-4 py-3">{item.network || '—'}</td>
                <td className="px-4 py-3">
                  <CopyableDigits value={item.address} />
                </td>
                <td className="px-4 py-3">
                  <GeoStatus active={item.isActive} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/participations/crypto-wallets/${item.id}`}
                    editTo={`/participations/crypto-wallets/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('cryptoWallets.confirmDelete'),
                        successMessage: t('cryptoWallets.deleted'),
                        path: `/crypto-wallets/${item.id}`,
                        queryKey: ['crypto-wallets'],
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
