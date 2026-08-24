import { Building, Plus } from 'lucide-react'
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
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import type { OrgUnit, Paginated } from '../../types/app'

export function OrgUnitsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['org-units', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<OrgUnit>>('/org-units', {
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
  const emptyMessage = q ? t('orgUnits.noResults') : t('orgUnits.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.orgUnits')}
        subtitle={t('orgUnits.subtitle')}
        action={
          <Link to="/headquarters/units/new">
            <Button>
              <Plus className="size-4" />
              {t('orgUnits.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="org-unit-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('orgUnits.search')}
        placeholder={t('orgUnits.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('orgUnits.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="phone"
                label={t('orgUnits.phone')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="manager"
                label={t('orgUnits.manager')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">
                {t('orgUnits.accommodationLiaisonCount')}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {t('orgUnits.caravanLiaisonCount')}
              </th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Building className="size-4 text-teal-600" aria-hidden />
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                  {item.phone ? localizeDigits(item.phone, locale) : '—'}
                </td>
                <td className="px-4 py-3">{item.manager?.fullName || '—'}</td>
                <td className="px-4 py-3">
                  {formatNumber(item.accommodationLiaisonCount, locale)}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(item.caravanLiaisonCount, locale)}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/headquarters/units/${item.id}`}
                    editTo={`/headquarters/units/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('orgUnits.confirmDelete'),
                        successMessage: t('orgUnits.deleted'),
                        path: `/org-units/${item.id}`,
                        queryKey: ['org-units'],
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
