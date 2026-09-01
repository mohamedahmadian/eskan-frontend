import { CalendarDays, Filter, HandHeart, Plus, Users } from 'lucide-react'
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
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import {
  currentPersianYear,
  formatNumber,
  persianYearOptions,
} from '../../lib/datetime'
import {
  OTHER_HONORARY_SERVICE,
  type HonoraryServant,
  type HonoraryServantStats,
  type HonoraryServiceType,
  type Paginated,
} from '../../types/app'
import {
  formatHonoraryHours,
  formatHonoraryWeekDays,
  honoraryServiceLabel,
} from './HonoraryServantForm'

export function HonoraryServantsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const year = searchParams.get('year') ?? ''
  const serviceTypeId = searchParams.get('serviceTypeId') ?? ''
  const currentYear = currentPersianYear()

  const statsQuery = useQuery({
    queryKey: ['honorary-servants', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<HonoraryServantStats>('/honorary-servants/stats')
      return data
    },
  })

  const typesQuery = useQuery({
    queryKey: ['honorary-service-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<HonoraryServiceType[]>('/honorary-service-types')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['honorary-servants', 'list', q, year, serviceTypeId, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HonoraryServant>>('/honorary-servants', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(year ? { year } : {}),
          ...(serviceTypeId ? { serviceTypeId } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(year || serviceTypeId)
  const emptyMessage = q || filtersActive ? t('honoraryServants.noResults') : t('honoraryServants.empty')
  const stats = statsQuery.data

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.honoraryServants')}
        subtitle={t('honoraryServants.subtitle')}
        action={
          <Link to="/honorary-servants/new">
            <Button>
              <Plus className="size-4" />
              {t('honoraryServants.create')}
            </Button>
          </Link>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <article className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
            <Users className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium text-ink-500">{t('honoraryServants.totalServants')}</p>
            <p className="text-xl font-semibold text-ink-900">
              {formatNumber(stats?.total ?? 0, locale)}
            </p>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-2xl border border-mint-100 bg-white px-4 py-3 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190,0.24)]">
            <CalendarDays className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-medium text-ink-500">
              {t('honoraryServants.currentYearServants', {
                year: formatNumber(stats?.year ?? currentYear, locale),
              })}
            </p>
            <p className="text-xl font-semibold text-ink-900">
              {formatNumber(stats?.currentYear ?? 0, locale)}
            </p>
          </div>
        </article>
      </div>
      <SearchBar
        inputId="honorary-servant-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('honoraryServants.search')}
        placeholder={t('honoraryServants.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <>
            <FormField icon={CalendarDays} label={t('honoraryServants.year')} htmlFor="honorary-year">
              <SearchSelect
                id="honorary-year"
                value={year}
                placeholder={t('honoraryServants.allYears')}
                onChange={(next) =>
                  setParams({ year: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('honoraryServants.allYears') },
                  ...persianYearOptions(locale, year ? Number(year) : undefined),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('honoraryServants.service')} htmlFor="honorary-service">
              <SearchSelect
                id="honorary-service"
                value={serviceTypeId}
                placeholder={t('honoraryServants.allServices')}
                onChange={(next) =>
                  setParams({ serviceTypeId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('honoraryServants.allServices') },
                  ...(typesQuery.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                  { value: OTHER_HONORARY_SERVICE, label: t('honoraryServants.otherService') },
                ]}
              />
            </FormField>
          </>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="fullName"
                label={t('honoraryServants.person')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="serviceType"
                label={t('honoraryServants.service')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="startDate"
                label={t('honoraryServants.startDate')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="endDate"
                label={t('honoraryServants.endDate')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('honoraryServants.weekDays')}</th>
              <SortableTh
                column="startTime"
                label={t('honoraryServants.hours')}
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
                    <HandHeart className="size-4 text-teal-600" aria-hidden />
                    {item.user.fullName}
                  </span>
                </td>
                <td className="px-4 py-3">{honoraryServiceLabel(item, t)}</td>
                <td className="px-4 py-3">
                  <DateText value={item.startDate} />
                </td>
                <td className="px-4 py-3">
                  <DateText value={item.endDate} />
                </td>
                <td className="px-4 py-3">{formatHonoraryWeekDays(item.weekDays, t)}</td>
                <td className="px-4 py-3" dir="ltr">
                  {formatHonoraryHours(item.startTime, item.endTime, locale)}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/honorary-servants/${item.id}`}
                    editTo={`/honorary-servants/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('honoraryServants.confirmDelete'),
                        successMessage: t('honoraryServants.deleted'),
                        path: `/honorary-servants/${item.id}`,
                        queryKey: ['honorary-servants'],
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
