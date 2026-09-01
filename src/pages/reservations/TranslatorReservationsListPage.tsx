import { CalendarDays, Filter, HeartHandshake } from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { DateEquivalents, DateText, YearEquivalents } from '../../components/ui/DateText'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { formatNumber, persianYearOptions } from '../../lib/datetime'
import {
  reservationTypes,
  type Paginated,
  type ReservationListItem,
  type ReservationType,
} from '../../types/app'
import { HeadcountPills } from './HeadcountPills'
import { listHeadcount } from './reservation-steps'
import { ReservationCodeBadge } from './ReservationCodeBadge'
import { ReservationStatusBadge } from './ReservationStatusBadge'

const typeOrder: ReservationType[] = [
  reservationTypes.INDIVIDUAL,
  reservationTypes.GROUP,
  reservationTypes.CARAVAN,
]

export function TranslatorReservationsListPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const year = searchParams.get('year') ?? ''
  const type = searchParams.get('type') ?? ''

  const query = useQuery({
    queryKey: ['reservations', 'assigned', q, year, type, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReservationListItem>>('/reservations/assigned', {
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
      <PageHeader title={t('menus.translatorReservations')} />
      <SearchBar
        inputId="translator-reservations-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('reservations.searchPlaceholder')}
        extra={
          <>
            <div className="min-w-0 lg:w-40">
              <FormField
                icon={CalendarDays}
                label={t('reservations.year')}
                htmlFor="translator-reservations-year"
              >
                <SearchSelect
                  id="translator-reservations-year"
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
              <FormField
                icon={Filter}
                label={t('reservations.type')}
                htmlFor="translator-reservations-type"
              >
                <SearchSelect
                  id="translator-reservations-type"
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
        filtersActive={filtersActive}
      />
      <TableCard
        loading={query.isLoading}
        empty={
          q || filtersActive
            ? t('translatorReservations.noResults')
            : t('translatorReservations.empty')
        }
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="code"
                label={t('reservations.code')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
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
              <th className="px-4 py-3 text-start font-medium">{t('reservations.honoraryService')}</th>
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
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const headcount = listHeadcount(row)
              const myServices = (row.honoraryAssignments ?? [])
                .filter((item) => item.user.id === user?.id)
                .map((item) => item.serviceType.name)
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <ReservationCodeBadge code={row.code} size="md" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div>{n(row.year)}</div>
                      <YearEquivalents year={row.year} />
                    </div>
                  </td>
                  <td className="px-4 py-3">{t(`reservations.types.${row.type}`)}</td>
                  <td className="px-4 py-3">
                    {myServices.length ? (
                      <span className="inline-flex items-center gap-1.5 text-ink-800">
                        <HeartHandshake className="size-3.5 shrink-0 text-mint-600" aria-hidden />
                        {myServices.join('، ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.stayStartDate ? (
                      <div className="space-y-0.5">
                        <div>
                          <DateText value={row.stayStartDate} />
                        </div>
                        <DateEquivalents value={row.stayStartDate} />
                      </div>
                    ) : (
                      '—'
                    )}
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
                    <ReservationStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <EntityRowActions viewTo={`/translator-reservations/${row.id}`} />
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
