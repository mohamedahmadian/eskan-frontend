import { Filter, Megaphone, Plus, Users } from 'lucide-react'
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
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import {
  announcementAudiences,
  type AnnouncementAudience,
  type HeadquartersAnnouncement,
  type Paginated,
} from '../../types/app'
import { PublishStatus } from '../headquarters-news/PublishStatus'

export function HeadquartersAnnouncementsListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const audience = (searchParams.get('audience') ?? '') as AnnouncementAudience | ''
  const published = searchParams.get('isPublished') ?? ''

  const query = useQuery({
    queryKey: [
      'headquarters-announcements',
      'list',
      q,
      audience,
      published,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HeadquartersAnnouncement>>(
        '/headquarters-announcements',
        {
          params: {
            page,
            ...(q ? { q } : {}),
            ...(audience ? { audience } : {}),
            ...(published ? { isPublished: published } : {}),
            ...sortParams,
          },
        },
      )
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(audience || published)
  const emptyMessage =
    q || filtersActive
      ? t('headquartersAnnouncements.noResults')
      : t('headquartersAnnouncements.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.headquartersAnnouncements')}
        subtitle={t('headquartersAnnouncements.subtitle')}
        action={
          <Link to="/headquarters/announcements/new">
            <Button>
              <Plus className="size-4" />
              {t('headquartersAnnouncements.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="headquarters-announcement-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('headquartersAnnouncements.search')}
        placeholder={t('headquartersAnnouncements.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair>
            <FormField
              icon={Users}
              label={t('headquartersAnnouncements.audience')}
              htmlFor="announcement-audience"
            >
              <SearchSelect
                id="announcement-audience"
                value={audience}
                placeholder={t('headquartersAnnouncements.allAudiences')}
                onChange={(next) =>
                  setParams({ audience: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('headquartersAnnouncements.allAudiences') },
                  ...Object.values(announcementAudiences).map((value) => ({
                    value,
                    label: t(`headquartersAnnouncements.audiences.${value}`),
                  })),
                ]}
              />
            </FormField>
            <FormField
              icon={Filter}
              label={t('headquartersAnnouncements.isPublished')}
              htmlFor="announcement-published"
            >
              <SearchSelect
                id="announcement-published"
                value={published}
                placeholder={t('headquartersAnnouncements.allStatuses')}
                onChange={(next) =>
                  setParams({ isPublished: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('headquartersAnnouncements.allStatuses') },
                  { value: 'true', label: t('headquartersAnnouncements.published') },
                  { value: 'false', label: t('headquartersAnnouncements.draft') },
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
                column="title"
                label={t('headquartersAnnouncements.titleLabel')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="audience"
                label={t('headquartersAnnouncements.audience')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="publishedAt"
                label={t('headquartersAnnouncements.publishedAt')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="isPublished"
                label={t('headquartersAnnouncements.isPublished')}
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
                    <Megaphone className="size-4 shrink-0 text-teal-600" aria-hidden />
                    {item.title}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t(`headquartersAnnouncements.audiences.${item.audience}`)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <DateText value={item.publishedAt} />
                </td>
                <td className="px-4 py-3">
                  <PublishStatus published={item.isPublished} ns="headquartersAnnouncements" />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/headquarters/announcements/${item.id}`}
                    editTo={`/headquarters/announcements/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('headquartersAnnouncements.confirmDelete'),
                        successMessage: t('headquartersAnnouncements.deleted'),
                        path: `/headquarters-announcements/${item.id}`,
                        queryKey: ['headquarters-announcements'],
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
