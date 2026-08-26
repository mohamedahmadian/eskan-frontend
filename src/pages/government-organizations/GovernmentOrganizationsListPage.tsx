import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { Link } from 'react-router-dom'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import type { GovernmentOrganization, Paginated } from '../../types/app'

export function GovernmentOrganizationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['government-organizations', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<GovernmentOrganization>>(
        '/government-organizations',
        {
          params: {
            page,
            ...(q ? { q } : {}),
            ...sortParams,
          },
        },
      )
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q
    ? t('governmentOrganizations.noResults')
    : t('governmentOrganizations.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.governmentOrganizations')}
        subtitle={t('governmentOrganizations.subtitle')}
        action={
          <Link to="/base-info/government-organizations/new">
            <Button>
              <Plus className="size-4" />
              {t('governmentOrganizations.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="gov-org-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('governmentOrganizations.search')}
        placeholder={t('governmentOrganizations.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('governmentOrganizations.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="phone"
                label={t('governmentOrganizations.phone')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="contactPerson"
                label={t('governmentOrganizations.contactPerson')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="mobile"
                label={t('governmentOrganizations.mobile')}
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
                <td className="px-4 py-3">{item.phone ? localizeDigits(item.phone, locale) : '—'}</td>
                <td className="px-4 py-3">{item.contactUser?.fullName || '—'}</td>
                <td className="px-4 py-3">{item.mobile ? localizeDigits(item.mobile, locale) : '—'}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/government-organizations/${item.id}`}
                    editTo={`/base-info/government-organizations/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('governmentOrganizations.confirmDelete'),
                        successMessage: t('governmentOrganizations.deleted'),
                        path: `/government-organizations/${item.id}`,
                        queryKey: ['government-organizations'],
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
