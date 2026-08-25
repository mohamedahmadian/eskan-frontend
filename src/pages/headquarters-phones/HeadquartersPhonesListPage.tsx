import { Landmark, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Button, EntityNameSubtitle, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useInvalidateHeadquartersBranding } from '../../hooks/useHeadquartersSummary'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import type { HeadquartersInfo, HeadquartersPhone, Paginated } from '../../types/app'

export function HeadquartersPhonesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const invalidateBranding = useInvalidateHeadquartersBranding()

  const headquarters = useQuery({
    queryKey: ['headquarters-info', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersInfo>(`/headquarters-info/${id}`)
      return data
    },
  })

  const query = useQuery({
    queryKey: ['headquarters-phones', 'list', id, q, page, sortBy, sortDir],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Paginated<HeadquartersPhone>>('/headquarters-phones', {
        params: {
          page,
          headquartersId: id,
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
  const emptyMessage = q ? t('headquartersPhones.noResults') : t('headquartersPhones.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('headquartersPhones.title')}
        subtitle={
          headquarters.data ? (
            <EntityNameSubtitle name={headquarters.data.name} icon={Landmark} />
          ) : (
            t('headquartersPhones.subtitle')
          )
        }
        action={
          <Link to={`/headquarters/info/${id}/phones/new`}>
            <Button>
              <Plus className="size-4" />
              {t('headquartersPhones.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="headquarters-phone-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('headquartersPhones.search')}
        placeholder={t('headquartersPhones.searchPlaceholder')}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="phone"
                label={t('headquartersPhones.phone')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="department"
                label={t('headquartersPhones.department')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('headquartersPhones.description')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                  {localizeDigits(item.phone, locale)}
                </td>
                <td className="px-4 py-3">{item.department || '—'}</td>
                <td className="px-4 py-3">{item.description || '—'}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/headquarters/info/${id}/phones/${item.id}`}
                    editTo={`/headquarters/info/${id}/phones/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('headquartersPhones.confirmDelete'),
                        successMessage: t('headquartersPhones.deleted'),
                        path: `/headquarters-phones/${item.id}`,
                        queryKey: ['headquarters-phones'],
                        onDeleted: () => {
                          void invalidateBranding()
                        },
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
