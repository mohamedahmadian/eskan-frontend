import { CalendarDays, Filter, Milestone, Route, Tent, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { DateText } from '../../components/ui/DateText'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber, persianYearOptions } from '../../lib/datetime'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import type { Paginated, StationStayFile, WalkingStation } from '../../types/app'

export function StationReservationHistoryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const stationId = searchParams.get('stationId') ?? ''
  const year = searchParams.get('year') ?? ''
  const present = searchParams.get('present') ?? ''
  const yearOptions = persianYearOptions(locale)

  const stations = useQuery({
    queryKey: ['walking-stations', 'mine', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<WalkingStation[]>('/walking-stations/mine')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['walking-stations', 'history', q, page, stationId, year, present, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<StationStayFile>>('/walking-stations/history', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(stationId ? { stationId } : {}),
          ...(year ? { year } : {}),
          ...(present === 'true' || present === 'false' ? { present } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(stationId || year || present)

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('stationHistory.title')} subtitle={t('stationHistory.subtitle')} />
      <SearchBar
        inputId="station-history-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('common.search')}
        placeholder={t('stationHistory.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair columns={3}>
            <FormField icon={Milestone} label={t('stationHistory.station')} htmlFor="history-station">
              <SearchSelect
                id="history-station"
                value={stationId}
                placeholder={t('stationHistory.allStations')}
                onChange={(next) =>
                  setParams({ stationId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('stationHistory.allStations') },
                  ...(stations.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={CalendarDays} label={t('stationHistory.year')} htmlFor="history-year">
              <SearchSelect
                id="history-year"
                value={year}
                placeholder={t('stationHistory.allYears')}
                onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('stationHistory.allYears') },
                  ...yearOptions,
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('stationHistory.presence')} htmlFor="history-present">
              <SearchSelect
                id="history-present"
                value={present}
                placeholder={t('stationHistory.allPresence')}
                onChange={(next) => setParams({ present: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('stationHistory.allPresence') },
                  { value: 'true', label: t('walkingStations.present') },
                  { value: 'false', label: t('walkingStations.absent') },
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={q || filtersActive ? t('stationHistory.noResults') : t('stationHistory.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="stayDate"
                label={t('stationHistory.stayDate')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('stationHistory.person')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('stationHistory.party')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('walkingStations.maleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('walkingStations.femaleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('stationHistory.walkingStart')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('stationHistory.route')}</th>
              <SortableTh
                column="present"
                label={t('stationHistory.presence')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const person = item.reservation.person ?? item.reservation.createdBy
              return (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <DateText value={item.stayDate} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink-900">
                        <UserRound className="size-3.5 text-teal-600" aria-hidden />
                        {person.fullName}
                      </span>
                      <ReservationCodeBadge code={item.reservation.code} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.reservation.partyName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Tent className="size-3.5 text-teal-600" aria-hidden />
                        {item.reservation.partyName}
                      </span>
                    ) : (
                      t(`reservations.types.${item.reservation.type}`)
                    )}
                  </td>
                  <td className="px-4 py-3">{formatNumber(item.maleCount, locale)}</td>
                  <td className="px-4 py-3">{formatNumber(item.femaleCount, locale)}</td>
                  <td className="px-4 py-3">
                    {item.reservation.walkingStartDate ? (
                      <DateText value={item.reservation.walkingStartDate} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.reservation.walkingRoute ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Route className="size-3.5 text-mint-600" aria-hidden />
                        {item.reservation.walkingRoute.name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                        item.present
                          ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                          : 'bg-rose-100 text-rose-700 ring-rose-200'
                      }`}
                    >
                      {item.present ? t('walkingStations.present') : t('walkingStations.absent')}
                    </span>
                  </td>
                </tr>
              )
            })}
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
