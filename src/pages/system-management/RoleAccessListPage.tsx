import { Plus, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ActionsTh,
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
  actionsColClassName,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { roleLabel } from '../../lib/roles'
import type { Paginated, RoleAccessListItem } from '../../types/app'

export function RoleAccessListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['roles', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<RoleAccessListItem> | RoleAccessListItem[]>(
        '/roles',
        {
          params: {
            page,
            ...(q ? { q } : {}),
            ...sortParams,
          },
        },
      )
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: 1,
          pageSize: data.length || 10,
        }
      }
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q ? t('roleAccess.noResults') : t('roleAccess.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Shield}
        title={t('menus.roleAccess')}
        subtitle={t('roleAccess.subtitle')}
        action={
          <Link to="/system-management/roles/new">
            <Button>
              <Plus className="size-4" />
              {t('roleAccess.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="role-access-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('roleAccess.search')}
        placeholder={t('roleAccess.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="nameKey" label={t('roleAccess.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="code" label={t('roleAccess.code')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="menuCount" label={t('roleAccess.menuCount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="userCount" label={t('roleAccess.userCount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div>{roleLabel(item, t)}</div>
                  <div className="mt-1 text-xs text-ink-500">
                    {item.isSystem ?? item.nameKey.startsWith('roles.')
                      ? t('roleAccess.systemRole')
                      : t('roleAccess.customRole')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="digit-field" dir="ltr">
                    {item.code}
                  </span>
                </td>
                <td className="px-4 py-3">{formatNumber(item.menuCount ?? 0, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.userCount ?? 0, locale)}</td>
                <td className={actionsColClassName}>
                  <EntityRowActions
                    viewTo={`/system-management/roles/${item.id}`}
                    editTo={`/system-management/roles/${item.id}/edit`}
                    canDelete={!item.isSystem}
                    onDelete={
                      item.isSystem
                        ? undefined
                        : () =>
                            confirmDelete({
                              message: t('roleAccess.confirmDelete'),
                              successMessage: t('roleAccess.deleted'),
                              path: `/roles/${item.id}`,
                              queryKey: ['roles'],
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
