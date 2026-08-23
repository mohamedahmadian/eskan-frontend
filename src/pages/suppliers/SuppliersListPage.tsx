import { Filter, Package, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { supplierTypes, type Paginated, type Supplier } from '../../types/app'

export function SuppliersListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const type = searchParams.get('type') ?? ''

  const query = useQuery({
    queryKey: ['suppliers', 'list', q, type, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Supplier>>('/suppliers', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(type ? { type } : {}),
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
  const emptyMessage = q || type ? t('suppliers.noResults') : t('suppliers.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.suppliers')}
        subtitle={t('suppliers.subtitle')}
        action={
          <Link to="/logistics/suppliers/new">
            <Button>
              <Plus className="size-4" />
              {t('suppliers.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="logistics-supplier-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('suppliers.search')}
        placeholder={t('suppliers.searchPlaceholder')}
        filtersActive={Boolean(type)}
        extra={
          <FormField icon={Filter} label={t('suppliers.type')} htmlFor="supplier-type">
            <SearchSelect
              id="supplier-type"
              value={type}
              placeholder={t('suppliers.allTypes')}
              onChange={(next) =>
                setParams({ type: next || undefined }, { resetPage: true })
              }
              options={[
                { value: '', label: t('suppliers.allTypes') },
                ...Object.values(supplierTypes).map((value) => ({
                  value,
                  label: t(`supplierTypes.${value}`),
                })),
              ]}
            />
          </FormField>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('suppliers.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="type" label={t('suppliers.type')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="contactPerson"
                label={t('suppliers.contactPerson')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh column="phone" label={t('suppliers.phone')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{t(`supplierTypes.${item.type}`)}</td>
                <td className="px-4 py-3">{item.contactPerson || '—'}</td>
                <td className="px-4 py-3">{item.phone || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EntityRowActions
                      viewTo={`/logistics/suppliers/${item.id}`}
                      editTo={`/logistics/suppliers/${item.id}/edit`}
                      onDelete={() =>
                        confirmDelete({
                          message: t('suppliers.confirmDelete'),
                          successMessage: t('suppliers.deleted'),
                          path: `/suppliers/${item.id}`,
                          queryKey: ['suppliers'],
                        })
                      }
                    />
                    <Link to={`/logistics/suppliers/${item.id}/items`}>
                      <Button type="button" variant="soft">
                        <Package className="size-4" aria-hidden />
                        {t('supplierItems.goods')}
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
