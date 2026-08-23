import {
  CalendarDays,
  Filter,
  Footprints,
  MapPin,
  Mars,
  Shield,
  UserRound,
  UserRoundCog,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { DateText } from '../../components/ui/DateText'
import { FormField, PageHeader, cardClassName, listShellClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import {
  reservationStatuses,
  reservationTypes,
  type City,
  type Country,
  type ManagedUser,
  type Paginated,
  type Province,
  type ReceptionCapacitySlice,
  type ReceptionDashboard,
  type ReservationListItem,
  type ReservationStatus,
  type ReservationType,
  type WalkingRoute,
} from '../../types/app'
import { CAPACITY_WARNING_RATIO, capacityKey } from './reservation-steps'
import { ReservationStatusBadge } from './ReservationStatusBadge'

const typeOrder: ReservationType[] = [
  reservationTypes.INDIVIDUAL,
  reservationTypes.GROUP,
  reservationTypes.CARAVAN,
]

const typeVisual: Record<
  ReservationType,
  { icon: LucideIcon; tone: string; accent: string }
> = {
  INDIVIDUAL: {
    icon: UserRound,
    tone: 'bg-teal-50 text-teal-700',
    accent: 'border-s-teal-400',
  },
  GROUP: {
    icon: Users,
    tone: 'bg-mint-50 text-mint-600',
    accent: 'border-s-mint-400',
  },
  CARAVAN: {
    icon: Footprints,
    tone: 'bg-gold-50 text-gold-600',
    accent: 'border-s-gold-400',
  },
}

const inProgressFilter = 'IN_PROGRESS'
const inProgressStatuses: ReservationStatus[] = [
  reservationStatuses.DRAFT,
  reservationStatuses.COMPANIONS,
  reservationStatuses.CARAVAN_CONTACTS,
  reservationStatuses.INSURANCE,
]

export function ReservationsAdminListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)

  const [yearPickerOpen, setYearPickerOpen] = useState(false)
  const year = searchParams.get('year') || String(currentPersianYear())
  const type = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const provinceId = searchParams.get('provinceId') ?? ''
  const originCityId = searchParams.get('originCityId') ?? ''
  const walkingRouteId = searchParams.get('walkingRouteId') ?? ''
  const caravanManagerId = searchParams.get('caravanManagerId') ?? ''
  const createdFrom = searchParams.get('createdFrom') ?? ''
  const createdTo = searchParams.get('createdTo') ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', iranId],
    enabled: Boolean(iranId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: iranId, activeOnly: true },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })

  const routes = useQuery({
    queryKey: ['walking-routes', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: { pageSize: 100 },
      })
      return data.items
    },
  })

  const managers = useQuery({
    queryKey: ['caravan-managers', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/caravan-managers')
      return data
    },
  })

  const dashboard = useQuery({
    queryKey: ['reservations', 'dashboard', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionDashboard>('/reservations/dashboard', {
        params: { year: Number(year) },
      })
      return data
    },
  })

  const listParams = {
    q: q || undefined,
    page,
    year: Number(year),
    type: type || undefined,
    status: status || undefined,
    originCityId: originCityId || undefined,
    walkingRouteId: walkingRouteId || undefined,
    caravanManagerId: caravanManagerId || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    ...sortParams,
  }

  const query = useQuery({
    queryKey: ['reservations', 'admin', listParams],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReservationListItem>>('/reservations', {
        params: listParams,
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(
    type || status || provinceId || originCityId || walkingRouteId || caravanManagerId || createdFrom || createdTo,
  )

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.reservationsAdmin')}
        subtitle={t('reservations.adminSubtitle')}
        className="mb-3 sm:gap-2"
        action={
          <button
            type="button"
            aria-expanded={yearPickerOpen}
            aria-controls="reservations-year-picker"
            onClick={() => setYearPickerOpen((open) => !open)}
            className="text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            {t('reservations.changeReportYear')}
          </button>
        }
      />
      <div className="mb-4 space-y-2.5">
        {yearPickerOpen ? (
          <div id="reservations-year-picker" className={`${cardClassName} p-4 sm:ms-auto sm:max-w-sm`}>
            <FormField icon={CalendarDays} label={t('reservations.year')} htmlFor="reservations-admin-year">
              <SearchSelect
                id="reservations-admin-year"
                value={year}
                onChange={(next) => setParams({ year: next }, { resetPage: true })}
                options={persianYearOptions(locale, Number(year))}
                placeholder={t('reservations.year')}
              />
            </FormField>
          </div>
        ) : null}
        {dashboard.data ? (
          <DashboardStats
            data={dashboard.data}
            status={status}
            onStatusFilter={(next) =>
              setParams({ status: next && next !== status ? next : undefined }, { resetPage: true })
            }
          />
        ) : null}
      </div>

      <SearchBar
        inputId="reservations-admin-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('reservations.searchAdminPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <>
            <FormField icon={Filter} label={t('reservations.type')}>
              <SearchSelect
                value={type}
                onChange={(next) => setParams({ type: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('reservations.type') },
                  ...typeOrder.map((item) => ({
                    value: item,
                    label: t(`reservations.types.${item}`),
                  })),
                ]}
                placeholder={t('reservations.type')}
              />
            </FormField>
            <FormField icon={Filter} label={t('reservations.status')}>
              <SearchSelect
                value={status}
                onChange={(next) => setParams({ status: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('reservations.status') },
                  { value: inProgressFilter, label: t('reservations.statusInProgress') },
                  ...Object.values(reservationStatuses).map((item) => ({
                    value: item,
                    label: t(`reservations.statuses.${item}`),
                  })),
                ]}
                placeholder={t('reservations.status')}
              />
            </FormField>
            <FormField icon={Footprints} label={t('reservations.filterWalkingRoute')}>
              <SearchSelect
                value={walkingRouteId}
                onChange={(next) =>
                  setParams({ walkingRouteId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('reservations.filterWalkingRoute') },
                  ...(routes.data ?? []).map((item) => ({ value: item.id, label: item.name })),
                ]}
                placeholder={t('reservations.filterWalkingRoute')}
              />
            </FormField>
            <FilterPair>
              <FormField icon={MapPin} label={t('reservations.province')}>
                <SearchSelect
                  value={provinceId}
                  onChange={(next) =>
                    setParams(
                      { provinceId: next || undefined, originCityId: undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: '', label: t('reservations.province') },
                    ...(provinces.data ?? []).map((item) => ({
                      value: item.id,
                      label: nameOf(item),
                    })),
                  ]}
                  placeholder={t('reservations.province')}
                />
              </FormField>
              <FormField icon={MapPin} label={t('reservations.originCity')}>
                <SearchSelect
                  value={originCityId}
                  disabled={!provinceId}
                  onChange={(next) =>
                    setParams({ originCityId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('reservations.originCity') },
                    ...(cities.data ?? []).map((item) => ({
                      value: item.id,
                      label: nameOf(item),
                    })),
                  ]}
                  placeholder={t('reservations.originCity')}
                />
              </FormField>
            </FilterPair>
            <FormField icon={UserRound} label={t('reservations.caravanManager')}>
              <SearchSelect
                value={caravanManagerId}
                onChange={(next) =>
                  setParams({ caravanManagerId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('reservations.caravanManager') },
                  ...(managers.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.fullName,
                  })),
                ]}
                placeholder={t('reservations.caravanManager')}
              />
            </FormField>
            <FilterPair>
              <FormField icon={CalendarDays} label={t('reservations.filterCreatedFrom')} htmlFor="created-from">
                <PersianDateField
                  id="created-from"
                  value={createdFrom || undefined}
                  onChange={(value) =>
                    setParams({ createdFrom: value || undefined }, { resetPage: true })
                  }
                />
              </FormField>
              <FormField icon={CalendarDays} label={t('reservations.filterCreatedTo')} htmlFor="created-to">
                <PersianDateField
                  id="created-to"
                  value={createdTo || undefined}
                  onChange={(value) =>
                    setParams({ createdTo: value || undefined }, { resetPage: true })
                  }
                />
              </FormField>
            </FilterPair>
          </>
        }
      />

      <TableCard
        loading={query.isLoading}
        empty={q || filtersActive ? t('reservations.noResults') : t('reservations.adminEmpty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="year" label={t('reservations.year')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="type" label={t('reservations.type')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="createdBy" label={t('reservations.applicant')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('reservations.caravanManager')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('reservations.maleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('reservations.femaleCount')}</th>
              <SortableTh column="totalCount" label={t('reservations.totalCount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="originCity" label={t('reservations.originCity')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="status" label={t('reservations.status')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="createdAt" label={t('reservations.createdAt')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{n(row.year)}</td>
                <td className="px-4 py-3">{t(`reservations.types.${row.type}`)}</td>
                <td className="px-4 py-3">{row.createdBy?.fullName ?? '—'}</td>
                <td className="px-4 py-3">{row.caravanManager?.fullName ?? '—'}</td>
                <td className="px-4 py-3">{n(row.maleCount)}</td>
                <td className="px-4 py-3">{n(row.femaleCount)}</td>
                <td className="px-4 py-3">{n(row.totalCount)}</td>
                <td className="px-4 py-3">{nameOf(row.originCity)}</td>
                <td className="px-4 py-3">
                  <ReservationStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <DateText value={row.createdAt} withTime />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions viewTo={`/reservations/${row.id}`} />
                </td>
              </tr>
            ))}
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

function DashboardStats({
  data,
  status,
  onStatusFilter,
}: {
  data: ReceptionDashboard
  status: string
  onStatusFilter: (next?: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const yearLabel = n(data.year)
  const totals: Array<[string, number, string]> = [
    ['dashboardAll', data.totals.all, ''],
    ['dashboardRejected', data.totals.rejected, reservationStatuses.REJECTED],
    ['dashboardCancelled', data.totals.cancelled, reservationStatuses.CANCELLED],
    ['dashboardPending', data.totals.pendingReview, reservationStatuses.PENDING_MANAGEMENT_REVIEW],
    ['dashboardInProgress', data.totals.inProgress, inProgressFilter],
    ['dashboardCompleted', data.totals.completed, reservationStatuses.COMPLETED],
  ]
  const inProgressActive =
    status === inProgressFilter || inProgressStatuses.includes(status as ReservationStatus)

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-ink-700">
        {t('reservations.statsForYear', { year: yearLabel })}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {totals.map(([key, value, filter]) => {
          const active = filter ? status === filter || (key === 'dashboardInProgress' && inProgressActive) : !status
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusFilter(filter || undefined)}
              className={`${cardClassName} flex items-center justify-between gap-3 px-4 py-2 text-start transition hover:bg-cream-50 ${
                active ? 'ring-2 ring-teal-400' : ''
              }`}
            >
              <p className="text-sm font-medium text-ink-600">
                {t(`reservations.${key}`)} · {yearLabel}
              </p>
              <p className="text-4xl font-semibold leading-none text-ink-900">{n(value)}</p>
            </button>
          )
        })}
      </div>
      <ProgressPipeline
        data={data}
        status={status}
        locale={locale}
        onStatusFilter={onStatusFilter}
      />
      <div className="grid gap-2.5 lg:grid-cols-3">
        {typeOrder.map((type) => (
          <TypeCapacityCard
            key={type}
            type={type}
            yearLabel={yearLabel}
            stats={data.types[capacityKey(type)]}
            slice={data.capacity[capacityKey(type)]}
          />
        ))}
      </div>
    </div>
  )
}

function ProgressPipeline({
  data,
  status,
  locale,
  onStatusFilter,
}: {
  data: ReceptionDashboard
  status: string
  locale: string
  onStatusFilter: (next?: string) => void
}) {
  const { t } = useTranslation()
  const n = (value: number) => formatNumber(value, locale)
  const steps: Array<{
    status: ReservationStatus
    icon: LucideIcon
    step: 'travel' | 'companions' | 'contacts' | 'insurance'
    count: number
    tone: string
  }> = [
    {
      status: reservationStatuses.DRAFT,
      icon: MapPin,
      step: 'travel',
      count: data.progress?.draft ?? 0,
      tone: 'bg-teal-50 text-teal-700',
    },
    {
      status: reservationStatuses.COMPANIONS,
      icon: Users,
      step: 'companions',
      count: data.progress?.companions ?? 0,
      tone: 'bg-mint-50 text-mint-600',
    },
    {
      status: reservationStatuses.CARAVAN_CONTACTS,
      icon: UserRoundCog,
      step: 'contacts',
      count: data.progress?.contacts ?? 0,
      tone: 'bg-gold-50 text-gold-600',
    },
    {
      status: reservationStatuses.INSURANCE,
      icon: Shield,
      step: 'insurance',
      count: data.progress?.insurance ?? 0,
      tone: 'bg-teal-50 text-teal-700',
    },
  ]

  return (
    <section className={`${cardClassName} px-3 py-2`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="shrink-0 text-xs font-medium text-ink-700">
          {t('reservations.inProgressPipeline')}
        </p>
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon
            const active = status === item.status
            return (
              <button
                key={item.status}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusFilter(item.status)}
                className={`flex items-center gap-2 rounded-xl px-2 py-1 text-start transition hover:bg-cream-50 ${item.tone} ${
                  active ? 'ring-2 ring-teal-400' : ''
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/80">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-ink-700">
                    {t(`reservations.steps.${item.step}`)}
                  </span>
                  <span className="text-lg font-semibold leading-none text-ink-900">
                    {n(item.count)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TypeCapacityCard({
  type,
  yearLabel,
  stats,
  slice,
}: {
  type: ReservationType
  yearLabel: string
  stats: ReceptionDashboard['types']['individual']
  slice: ReceptionCapacitySlice
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const visual = typeVisual[type]
  const TypeIcon = visual.icon
  const genders = [
    {
      key: 'male',
      icon: Mars,
      label: t('reservations.male'),
      used: slice.maleUsed,
      capacity: slice.maleCapacity,
      remain: slice.maleRemaining,
      tile: 'bg-gold-50 text-gold-600',
      bar: 'bg-gold-400',
    },
    {
      key: 'female',
      icon: Venus,
      label: t('reservations.female'),
      used: slice.femaleUsed,
      capacity: slice.femaleCapacity,
      remain: slice.femaleRemaining,
      tile: 'bg-teal-50 text-teal-700',
      bar: 'bg-teal-400',
    },
  ] as const

  return (
    <article className={`${cardClassName} space-y-2 border-s-4 p-3 ${visual.accent}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${visual.tone}`}>
          <TypeIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900">
            {t(`reservations.types.${type}`)} · {yearLabel}
          </p>
          <p className="text-[11px] text-ink-500">
            {n(stats.reservations)} {t('reservations.reservationCount')}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {genders.map((item) => (
          <GenderCapacityTile key={item.key} {...item} locale={locale} />
        ))}
      </div>
    </article>
  )
}

function GenderCapacityTile({
  icon: Icon,
  label,
  used,
  capacity,
  remain,
  tile,
  bar,
  locale,
}: {
  icon: LucideIcon
  label: string
  used: number
  capacity: number
  remain: number
  tile: string
  bar: string
  locale: string
}) {
  const { t } = useTranslation()
  const n = (value: number) => formatNumber(value, locale)
  const ratio = capacity > 0 ? used / capacity : 0
  const percent = Math.min(100, Math.round(ratio * 100))
  const warning = ratio >= CAPACITY_WARNING_RATIO

  return (
    <div
      className={`rounded-xl px-2.5 py-2 ${tile} ${warning ? 'ring-1 ring-amber-300' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/80">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="text-[11px] font-medium">{label}</span>
        <span className="ms-auto text-lg font-semibold leading-none text-ink-900">{n(used)}</span>
      </div>
      <p className="mt-1 text-[10px] text-ink-500">
        {t('reservations.ofCapacity', { capacity: n(capacity) })} · {t('reservations.capacityRemain')}{' '}
        {n(remain)}
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/70">
        <div
          className={`h-full rounded-full ${warning ? 'bg-amber-500' : bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {warning ? (
        <p className="mt-1 text-[10px] font-medium text-amber-800">{t('reservations.capacityLow')}</p>
      ) : null}
    </div>
  )
}
