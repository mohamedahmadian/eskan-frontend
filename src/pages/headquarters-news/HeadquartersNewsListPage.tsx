import { Filter, Newspaper, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
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
import type { HeadquartersNews, Paginated } from '../../types/app'
import { PublishStatus } from './PublishStatus'

export function HeadquartersNewsListPage() {
  const { t } = useTranslation()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const published = searchParams.get('isPublished') ?? ''

  const query = useQuery({
    queryKey: ['headquarters-news', 'list', q, published, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HeadquartersNews>>('/headquarters-news', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(published ? { isPublished: published } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(published)
  const emptyMessage = q || filtersActive ? t('headquartersNews.noResults') : t('headquartersNews.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.headquartersNews')}
        subtitle={t('headquartersNews.subtitle')}
        action={
          <Link to="/headquarters/news/new">
            <Button>
              <Plus className="size-4" />
              {t('headquartersNews.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="headquarters-news-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('headquartersNews.search')}
        placeholder={t('headquartersNews.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FormField icon={Filter} label={t('headquartersNews.isPublished')} htmlFor="news-published">
            <SearchSelect
              id="news-published"
              value={published}
              placeholder={t('headquartersNews.allStatuses')}
              onChange={(next) =>
                setParams({ isPublished: next || undefined }, { resetPage: true })
              }
              options={[
                { value: '', label: t('headquartersNews.allStatuses') },
                { value: 'true', label: t('headquartersNews.published') },
                { value: 'false', label: t('headquartersNews.draft') },
              ]}
            />
          </FormField>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="title"
                label={t('headquartersNews.titleLabel')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="publishedAt"
                label={t('headquartersNews.publishedAt')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="isPublished"
                label={t('headquartersNews.isPublished')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('headquartersNews.availableLocales')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Newspaper className="size-4 shrink-0 text-teal-600" aria-hidden />
                    <span>
                      <span className="block">{item.title}</span>
                      {item.summary ? (
                        <span className="mt-0.5 block text-xs text-ink-500">{item.summary}</span>
                      ) : null}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <DateText value={item.publishedAt} />
                </td>
                <td className="px-4 py-3">
                  <PublishStatus published={item.isPublished} ns="headquartersNews" />
                </td>
                <td className="px-4 py-3">
                  {(item.translatedLocales ?? []).length ? (
                    <span className="inline-flex flex-wrap gap-1">
                      {(item.translatedLocales ?? []).map((locale) => (
                        <span
                          key={locale}
                          className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700"
                        >
                          {t(`languages.${locale}`, { defaultValue: locale })}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-ink-400">{t('headquartersNews.fallbackPersian')}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/headquarters/news/${item.id}`}
                    editTo={`/headquarters/news/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('headquartersNews.confirmDelete'),
                        successMessage: t('headquartersNews.deleted'),
                        path: `/headquarters-news/${item.id}`,
                        queryKey: ['headquarters-news'],
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
