import { Calendar, Filter, MapPin, Plus, Sparkles, Tent } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  SortableTh,
  ActionsTh,
  actionsColClassName,
  FilterPair,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { caravanStatuses, type Caravan, type City, type Paginated } from '../../types/app'
import { CaravanStatusBadge } from './CaravanStatusBadge'

function foundedYearFilterOptions(locale: string, selected?: number) {
  const current = currentPersianYear()
  const max = Math.max(current, selected ?? current)
  const min = Math.min(1300, selected ?? 1300)
  const options = []
  for (let year = max; year >= min; year -= 1) {
    options.push({ value: String(year), label: formatNumber(year, locale) })
  }
  return options
}

export function CaravansListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const cityId = searchParams.get('cityId') ?? ''
  const foundedYear = searchParams.get('foundedYear') ?? ''
  const status = searchParams.get('status') ?? ''
  const filtersActive = Boolean(cityId || foundedYear || status)

  const cities = useQuery({
    queryKey: ['cities', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', { params: { activeOnly: true } })
      return data
    },
  })

  const query = useQuery({
    queryKey: ['caravans', q, cityId, foundedYear, status, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans', {
        params: {
          q: q || undefined,
          page,
          ...(cityId ? { cityId } : {}),
          ...(foundedYear ? { foundedYear } : {}),
          ...(status ? { status } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const pendingReview = useQuery({
    queryKey: ['caravans', 'pending-review', 'count'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<{ id: string }>>('/caravans', {
        params: { status: caravanStatuses.PENDING_REVIEW, page: 1, pageSize: 1 },
      })
      return data.total
    },
  })
  const pendingReviewCount = pendingReview.data ?? 0
  const pendingReviewActive = status === caravanStatuses.PENDING_REVIEW
  const showPendingReviewShortcut = pendingReviewCount > 0 || pendingReviewActive

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Tent}
        title={t('menus.caravansList')}
        subtitle={t('caravans.subtitle')}
        action={
          <Link to="/caravans/new">
            <Button>
              <Plus className="size-4" />
              {t('caravans.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('caravans.searchPlaceholder')}
        filtersActive={filtersActive}
        endAction={
          showPendingReviewShortcut ? (
            <Button
              type="button"
              variant={pendingReviewActive ? 'primary' : 'soft'}
              aria-pressed={pendingReviewActive}
              onClick={() =>
                setParams(
                  {
                    status: pendingReviewActive
                      ? undefined
                      : caravanStatuses.PENDING_REVIEW,
                  },
                  { resetPage: true },
                )
              }
            >
              <Sparkles className="size-4" aria-hidden />
              {t('caravans.showPendingReview')}
              {pendingReviewCount > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-4 ${
                    pendingReviewActive ? 'bg-white text-teal-700' : 'bg-white/90 text-teal-700'
                  }`}
                >
                  {formatNumber(pendingReviewCount, locale)}
                </span>
              ) : null}
            </Button>
          ) : undefined
        }
        extra={
          <FilterPair columns={3}>
            <FormField icon={MapPin} label={t('caravans.city')} htmlFor="caravan-city">
              <SearchSelect
                id="caravan-city"
                value={cityId}
                placeholder={t('caravans.allCities')}
                onChange={(next) =>
                  setParams({ cityId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('caravans.allCities') },
                  ...(cities.data ?? []).map((city) => ({
                    value: city.id,
                    label: nameOf(city),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Calendar} label={t('caravans.foundedYear')} htmlFor="caravan-founded-year">
              <SearchSelect
                id="caravan-founded-year"
                value={foundedYear}
                placeholder={t('caravans.allYears')}
                onChange={(next) =>
                  setParams({ foundedYear: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('caravans.allYears') },
                  ...foundedYearFilterOptions(
                    locale,
                    foundedYear ? Number(foundedYear) : undefined,
                  ),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('caravans.status')} htmlFor="caravan-status">
              <SearchSelect
                id="caravan-status"
                value={status}
                placeholder={t('caravans.allStatuses')}
                onChange={(next) =>
                  setParams({ status: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('caravans.allStatuses') },
                  ...Object.values(caravanStatuses).map((item) => ({
                    value: item,
                    label: t(`caravanStatuses.${item}`),
                  })),
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={q || filtersActive ? t('caravans.noResults') : t('caravans.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="name"
                label={t('caravans.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t('caravans.city')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="manager"
                label={t('caravans.manager')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="status"
                label={t('caravans.status')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((caravan) => (
              <tr key={caravan.id} className="border-t border-line">
                <td className="px-4 py-3">{caravan.name}</td>
                <td className="px-4 py-3">{caravan.city ? nameOf(caravan.city) : '—'}</td>
                <td className="px-4 py-3">{caravan.manager?.fullName ?? '—'}</td>
                <td className="px-4 py-3">
                  <CaravanStatusBadge status={caravan.status} isActive={caravan.isActive} />
                </td>
                <td className={actionsColClassName}>
                  <EntityRowActions
                    viewTo={`/caravans/${caravan.id}`}
                    editTo={`/caravans/${caravan.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('caravans.confirmDelete'),
                        successMessage: t('caravans.deleted'),
                        path: `/caravans/${caravan.id}`,
                        queryKey: ['caravans'],
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
