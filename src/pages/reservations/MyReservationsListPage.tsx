import { CalendarDays, Filter, Plus } from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { DateText } from '../../components/ui/DateText'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import {
  reservationTypes,
  type Paginated,
  type ReservationListItem,
  type ReservationType,
} from '../../types/app'
import { HeadcountPills } from './HeadcountPills'
import {
  createWizardPath,
  isOwnerCreateDraft,
  listHeadcount,
  listStepProgress,
} from './reservation-steps'
import { ReservationStatusBadge } from './ReservationStatusBadge'
import { StepProgressChart } from './StepProgressChart'

const typeOrder: ReservationType[] = [
  reservationTypes.INDIVIDUAL,
  reservationTypes.GROUP,
  reservationTypes.CARAVAN,
]

export function MyReservationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const year = searchParams.get('year') ?? ''
  const type = searchParams.get('type') ?? ''

  const query = useQuery({
    queryKey: ['reservations', 'mine', q, year, type, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReservationListItem>>('/reservations/mine', {
        params: {
          q: q || undefined,
          page,
          year: year ? Number(year) : undefined,
          type: type || undefined,
          ...sortParams,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(year || type)

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.myReservations')}
        action={
          <Link to="/my-reservations/new">
            <Button>
              <Plus className="size-4" aria-hidden />
              {t('reservations.createYear', { year: formatNumber(currentPersianYear(), locale) })}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="my-reservations-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('reservations.searchPlaceholder')}
        beside={
          <>
            <div className="min-w-0 lg:w-40">
              <FormField icon={CalendarDays} label={t('reservations.year')} htmlFor="my-reservations-year">
                <SearchSelect
                  id="my-reservations-year"
                  value={year}
                  onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                  placeholder={t('reservations.allYears')}
                  options={[
                    { value: '', label: t('reservations.allYears') },
                    ...persianYearOptions(locale, year ? Number(year) : undefined),
                  ]}
                />
              </FormField>
            </div>
            <div className="min-w-0 lg:w-40">
              <FormField icon={Filter} label={t('reservations.type')} htmlFor="my-reservations-type">
                <SearchSelect
                  id="my-reservations-type"
                  value={type}
                  onChange={(next) => setParams({ type: next || undefined }, { resetPage: true })}
                  placeholder={t('reservations.allTypes')}
                  options={[
                    { value: '', label: t('reservations.allTypes') },
                    ...typeOrder.map((item) => ({
                      value: item,
                      label: t(`reservations.types.${item}`),
                    })),
                  ]}
                />
              </FormField>
            </div>
          </>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={q || filtersActive ? t('reservations.noResults') : t('reservations.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="year"
                label={t('reservations.year')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="type"
                label={t('reservations.type')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="stayStartDate"
                label={t('reservations.stayStartDateShort')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="totalCount"
                label={t('reservations.totalCount')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="status"
                label={t('reservations.status')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-center font-medium">{t('reservations.progress')}</th>
              <th className="px-4 py-3 text-center font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const step = listStepProgress(row.status, row.type)
              const headcount = listHeadcount(row)
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">{n(row.year)}</td>
                  <td className="px-4 py-3">{t(`reservations.types.${row.type}`)}</td>
                  <td className="px-4 py-3">
                    {row.stayStartDate ? <DateText value={row.stayStartDate} /> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <HeadcountPills
                      type={row.type}
                      male={headcount.male}
                      female={headcount.female}
                      total={headcount.total}
                      format={n}
                      maleLabel={t('reservations.countMale')}
                      femaleLabel={t('reservations.countFemale')}
                      totalLabel={t('reservations.countTotal')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <ReservationStatusBadge status={row.status} />
                      {step.showRemaining ? (
                        <span className="text-xs text-ink-500">
                          {t('reservations.stepsUntilComplete', {
                            count: formatNumber(step.remaining, locale),
                          })}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <StepProgressChart
                        compact
                        currentIndex={step.currentIndex}
                        total={step.total}
                        locale={locale}
                        label={
                          step.showRemaining
                            ? t('reservations.stepsUntilComplete', {
                                count: formatNumber(step.remaining, locale),
                              })
                            : t(`reservations.statuses.${row.status}`)
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <EntityRowActions
                        viewTo={
                          isOwnerCreateDraft(row)
                            ? createWizardPath(row.id)
                            : `/my-reservations/${row.id}`
                        }
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  )
}
