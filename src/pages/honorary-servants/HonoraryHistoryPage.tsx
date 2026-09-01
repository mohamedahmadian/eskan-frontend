import { CalendarDays, Filter, HandHeart, Plus } from 'lucide-react'
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
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { persianYearOptions } from '../../lib/datetime'
import {
  OTHER_HONORARY_SERVICE,
  type HonoraryServant,
  type HonoraryServiceType,
  type Paginated,
} from '../../types/app'
import {
  formatHonoraryHours,
  formatHonoraryWeekDays,
  honoraryServiceLabel,
} from './HonoraryServantForm'

export function HonoraryHistoryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const year = searchParams.get('year') ?? ''
  const serviceTypeId = searchParams.get('serviceTypeId') ?? ''

  const typesQuery = useQuery({
    queryKey: ['honorary-service-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<HonoraryServiceType[]>('/honorary-service-types')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['honorary-servants', 'mine', q, year, serviceTypeId, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HonoraryServant>>('/honorary-servants/mine', {
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
  const emptyMessage =
    q || filtersActive ? t('honoraryServants.historyNoResults') : t('honoraryServants.historyEmpty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.honoraryHistory')}
        subtitle={t('honoraryServants.historySubtitle')}
        action={
          <Link to="/honorary-apply">
            <Button>
              <Plus className="size-4" />
              {t('honoraryServants.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="honorary-history-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('honoraryServants.search')}
        placeholder={t('honoraryServants.historySearchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <>
            <FormField icon={CalendarDays} label={t('honoraryServants.year')} htmlFor="honorary-history-year">
              <SearchSelect
                id="honorary-history-year"
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
            <FormField icon={Filter} label={t('honoraryServants.service')} htmlFor="honorary-history-service">
              <SearchSelect
                id="honorary-history-service"
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
                    {honoraryServiceLabel(item, t)}
                  </span>
                </td>
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
                  <EntityRowActions viewTo={`/honorary-history/${item.id}`} />
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
