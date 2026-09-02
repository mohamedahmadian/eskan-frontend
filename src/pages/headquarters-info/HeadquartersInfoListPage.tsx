import { Landmark, Plus } from 'lucide-react'
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
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getImageUrl } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { HeadquartersInfo, Paginated } from '../../types/app'

export function HeadquartersInfoListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['headquarters-info', 'list', q, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HeadquartersInfo>>('/headquarters-info', {
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
  const canCreate = (query.data?.total ?? 0) === 0
  const emptyMessage = q ? t('headquartersInfo.noResults') : t('headquartersInfo.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.headquartersInfo')}
        subtitle={t('headquartersInfo.subtitle')}
        action={
          canCreate ? (
            <Link to="/headquarters/info/new">
              <Button>
                <Plus className="size-4" />
                {t('headquartersInfo.create')}
              </Button>
            </Link>
          ) : undefined
        }
      />
      <SearchBar
        inputId="headquarters-info-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('headquartersInfo.search')}
        placeholder={t('headquartersInfo.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('headquartersInfo.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="title"
                label={t('headquartersInfo.titleLabel')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="activityStartYear"
                label={t('headquartersInfo.activityStartYear')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="address"
                label={t('headquartersInfo.address')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="neshanAddress"
                label={t('headquartersInfo.neshanAddress')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">
                {t('headquartersInfo.location')}
              </th>
              <SortableTh
                column="phoneCount"
                label={t('headquartersInfo.phoneCount')}
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
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    {item.logoId ? (
                      <img
                        src={getImageUrl(item.logoId)}
                        alt=""
                        className="size-9 rounded-xl object-cover ring-1 ring-teal-100"
                      />
                    ) : (
                      <Landmark className="size-4 text-teal-600" aria-hidden />
                    )}
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3">{item.title || '—'}</td>
                <td className="px-4 py-3">
                  {item.activityStartYear != null
                    ? formatNumber(item.activityStartYear, locale)
                    : '—'}
                </td>
                <td className="px-4 py-3">{item.address || '—'}</td>
                <td className="px-4 py-3">
                  {item.neshanAddress ? (
                    <span dir="ltr" className="block max-w-[14rem] truncate">
                      {item.neshanAddress}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {item.latitude != null && item.longitude != null
                    ? t('headquartersInfo.locationSet')
                    : '—'}
                </td>
                <td className="px-4 py-3">{formatNumber(item.phoneCount, locale)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/headquarters/info/${item.id}`}
                    editTo={`/headquarters/info/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('headquartersInfo.confirmDelete'),
                        successMessage: t('headquartersInfo.deleted'),
                        path: `/headquarters-info/${item.id}`,
                        queryKey: ['headquarters-info'],
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
