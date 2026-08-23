import {
  ArrowLeftRight,
  Building2,
  CalendarDays,
  Check,
  CircleOff,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  Button,
  FormField,
  LoadingState,
  PageHeader,
  ToggleField,
  cardClassName,
  listShellClassName,
} from '../../components/ui/Form'
import {
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import {
  currentPersianYear,
  formatNumber,
  persianYearOptions,
} from '../../lib/datetime'
import type {
  Accommodation,
  AccommodationYearRow,
  AccommodationYearStats,
  AccommodationYearTransferResult,
  Paginated,
} from '../../types/app'

type YearTab = 'manage' | 'transfer'
type YearActivityFilter = 'all' | 'active' | 'inactive'

function parseYear(raw: string | null, fallback: number) {
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

function parseActivity(raw: string | null): YearActivityFilter {
  if (raw === 'active' || raw === 'inactive') return raw
  return 'all'
}

function YearStatsCards({
  stats,
  locale,
  year,
  activity,
  onSelect,
  onActivateAllInactive,
  onDeactivateAllActive,
  activatingAll,
  deactivatingAll,
}: {
  stats: AccommodationYearStats | undefined
  locale: string
  year?: number
  activity?: YearActivityFilter
  onSelect?: (next: YearActivityFilter) => void
  onActivateAllInactive?: () => void
  onDeactivateAllActive?: () => void
  activatingAll?: boolean
  deactivatingAll?: boolean
}) {
  const { t } = useTranslation()
  const yearLabel = year != null ? formatNumber(year, locale) : ''
  const cards = [
    {
      key: 'all' as const,
      icon: Building2,
      tone: 'bg-teal-50 text-teal-700',
      label: t('accommodationYearManagement.statTotal'),
      value: stats?.total ?? 0,
    },
    {
      key: 'active' as const,
      icon: CalendarDays,
      tone: 'bg-teal-50 text-teal-700',
      label: t('accommodationYearManagement.statActive', { year: yearLabel }),
      value: stats?.active ?? 0,
    },
    {
      key: 'inactive' as const,
      icon: CircleOff,
      tone: 'bg-gold-50 text-gold-600',
      label: t('accommodationYearManagement.statInactive', { year: yearLabel }),
      value: stats?.inactive ?? 0,
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const selected = activity === card.key
        const interactive = Boolean(onSelect)
        const className = `${cardClassName} flex flex-col gap-4 p-5 text-start transition ${
          selected
            ? 'ring-2 ring-teal-400 shadow-[0_10px_28px_rgba(46,189,182,0.18)]'
            : interactive
              ? 'hover:border-teal-200'
              : ''
        }`
        const body = (
          <>
            <div className="flex items-center gap-4">
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}
              >
                <card.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-ink-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-ink-900">
                  {formatNumber(card.value, locale)}
                </p>
              </div>
            </div>
            {card.key === 'active' && onDeactivateAllActive ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-red-700"
                disabled={deactivatingAll || (stats?.active ?? 0) <= 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDeactivateAllActive()
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                {t('accommodationYearManagement.deactivateAllActive', {
                  year: yearLabel,
                })}
              </Button>
            ) : null}
            {card.key === 'inactive' && onActivateAllInactive ? (
              <Button
                type="button"
                variant="soft"
                className="w-full"
                disabled={activatingAll || (stats?.inactive ?? 0) <= 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onActivateAllInactive()
                }}
              >
                <Plus className="size-4" aria-hidden />
                {t('accommodationYearManagement.activateAllInactive', {
                  year: yearLabel,
                })}
              </Button>
            ) : null}
          </>
        )
        if (!interactive) {
          return (
            <article key={card.key} className={className}>
              {body}
            </article>
          )
        }
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect?.(card.key)}
            className={className}
          >
            {body}
          </button>
        )
      })}
    </section>
  )
}

function YearTabNav({ tab, onChange }: { tab: YearTab; onChange: (tab: YearTab) => void }) {
  const { t } = useTranslation()
  const tabs: YearTab[] = ['manage', 'transfer']
  return (
    <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
            tab === item
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
          }`}
        >
          {t(`accommodationYearManagement.tabs.${item}`)}
        </button>
      ))}
    </nav>
  )
}

function ActivityFilterBar({
  activity,
  stats,
  locale,
  year,
  onChange,
}: {
  activity: YearActivityFilter
  stats: AccommodationYearStats | undefined
  locale: string
  year: number
  onChange: (next: YearActivityFilter) => void
}) {
  const { t } = useTranslation()
  const yearLabel = formatNumber(year, locale)
  const filters: {
    key: YearActivityFilter
    label: string
    count: number
  }[] = [
    {
      key: 'all',
      label: t('accommodationYearManagement.filterAll', { year: yearLabel }),
      count: stats?.total ?? 0,
    },
    {
      key: 'active',
      label: t('accommodationYearManagement.filterActive', { year: yearLabel }),
      count: stats?.active ?? 0,
    },
    {
      key: 'inactive',
      label: t('accommodationYearManagement.filterInactive', { year: yearLabel }),
      count: stats?.inactive ?? 0,
    },
  ]

  return (
    <div className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
      {filters.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
            activity === item.key
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
          }`}
        >
          <span>{item.label}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
              activity === item.key ? 'bg-white/20 text-white' : 'bg-white text-ink-500'
            }`}
          >
            {formatNumber(item.count, locale)}
          </span>
        </button>
      ))}
    </div>
  )
}

function managerLabel(item: Accommodation, year: number, unassigned: string) {
  const managers = item.managers
    .filter((row) => row.year === year && row.userId)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
  if (!managers.length) return unassigned
  return managers.map((row) => row.user?.fullName ?? unassigned).join('، ')
}

export function AccommodationYearManagementPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)

  const currentYear = currentPersianYear()
  const tabParam = searchParams.get('tab')
  const tab: YearTab = tabParam === 'transfer' ? 'transfer' : 'manage'

  const manageYear = parseYear(searchParams.get('year'), currentYear)
  const sourceYear = parseYear(searchParams.get('sourceYear'), currentYear - 1)
  const yearActivity = parseActivity(searchParams.get('yearActivity'))
  const yearFromUrl = searchParams.get('year')
  const sourceFromUrl = searchParams.get('sourceYear')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copyManagers, setCopyManagers] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    if (tab === 'manage' && !yearFromUrl) {
      setParams({ year: String(currentYear) })
    }
  }, [tab, yearFromUrl, currentYear, setParams])

  useEffect(() => {
    if (tab === 'transfer' && !sourceFromUrl) {
      setParams({ sourceYear: String(currentYear - 1) })
    }
  }, [tab, sourceFromUrl, currentYear, setParams])

  useEffect(() => {
    setSelected(new Set())
  }, [sourceYear, q, page, sortBy, sortDir])

  const activeYear = tab === 'manage' ? manageYear : sourceYear

  const statsQuery = useQuery({
    queryKey: ['accommodations', 'year-management', 'stats', activeYear],
    queryFn: async () => {
      const { data } = await api.get<AccommodationYearStats>(
        '/accommodations/year-management/stats',
        { params: { year: activeYear } },
      )
      return data
    },
  })

  const manageListParams = {
    year: manageYear,
    yearActivity,
    page,
    ...(q ? { q } : {}),
    ...sortParams,
  }

  const manageListQuery = useQuery({
    queryKey: ['accommodations', 'year-management', 'list', manageListParams],
    enabled: tab === 'manage',
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<AccommodationYearRow>>(
        '/accommodations/year-management/list',
        { params: manageListParams },
      )
      return data
    },
  })

  const transferListParams = {
    year: sourceYear,
    page,
    ...(q ? { q } : {}),
    ...sortParams,
  }

  const transferListQuery = useQuery({
    queryKey: ['accommodations', 'year-management', 'active', 'transfer', transferListParams],
    enabled: tab === 'transfer',
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<Accommodation>>(
        '/accommodations/year-management/active',
        { params: transferListParams },
      )
      return data
    },
  })

  async function invalidateYearQueries() {
    await queryClient.invalidateQueries({
      queryKey: ['accommodations', 'year-management'],
    })
    await queryClient.invalidateQueries({ queryKey: ['accommodations'] })
  }

  const addMutation = useMutation({
    mutationFn: async (accommodationId: string) =>
      api.post('/accommodations/year-management/add', {
        accommodationId,
        year: manageYear,
      }),
    onSuccess: async () => {
      toast.success(t('accommodationYearManagement.added'))
      await invalidateYearQueries()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
    onSettled: () => setPendingId(null),
  })

  const activateAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ year: number; activated: number }>(
        '/accommodations/year-management/activate-all',
        { year: manageYear },
      )
      return data
    },
    onSuccess: async (result) => {
      if (result.activated <= 0) {
        toast.message(t('accommodationYearManagement.activateAllEmpty'))
      } else {
        toast.success(
          t('accommodationYearManagement.activateAllDone', {
            count: formatNumber(result.activated, locale),
            year: formatNumber(result.year, locale),
          }),
        )
      }
      await invalidateYearQueries()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const deactivateAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        year: number
        removed: number
        accommodations: number
      }>('/accommodations/year-management/deactivate-all', { year: manageYear })
      return data
    },
    onSuccess: async (result) => {
      if (result.accommodations <= 0) {
        toast.message(t('accommodationYearManagement.deactivateAllEmpty'))
      } else {
        toast.success(
          t('accommodationYearManagement.deactivateAllDone', {
            count: formatNumber(result.accommodations, locale),
            year: formatNumber(result.year, locale),
          }),
        )
      }
      await invalidateYearQueries()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (accommodationId: string) =>
      api.delete(`/accommodations/year-management/${accommodationId}`, {
        params: { year: manageYear },
      }),
    onSuccess: async () => {
      toast.success(t('accommodationYearManagement.removed'))
      await invalidateYearQueries()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
    onSettled: () => setPendingId(null),
  })

  const transferMutation = useMutation({
    mutationFn: async (payload: { all?: boolean; accommodationIds?: string[] }) => {
      const { data } = await api.post<AccommodationYearTransferResult>(
        '/accommodations/year-management/transfer',
        {
          sourceYear,
          targetYear: currentYear,
          copyManagers,
          ...payload,
        },
      )
      return data
    },
    onSuccess: async (result) => {
      toast.success(
        t('accommodationYearManagement.transferDone', {
          transferred: formatNumber(result.transferred, locale),
          skipped: formatNumber(result.skipped, locale),
        }),
      )
      setSelected(new Set())
      await invalidateYearQueries()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const manageItems = manageListQuery.data?.items ?? []
  const manageTotal = manageListQuery.data?.total ?? 0
  const managePageSize = manageListQuery.data?.pageSize ?? 10
  const transferItems = transferListQuery.data?.items ?? []
  const transferTotal = transferListQuery.data?.total ?? 0
  const transferPageSize = transferListQuery.data?.pageSize ?? 10

  const allSelected = useMemo(
    () =>
      transferItems.length > 0 &&
      transferItems.every((item) => selected.has(item.id)),
    [transferItems, selected],
  )

  function setTab(next: YearTab) {
    setParams({
      tab: next === 'manage' ? undefined : next,
      q: undefined,
      page: '1',
      sortBy: undefined,
      sortDir: undefined,
      yearActivity: undefined,
    })
  }

  function setYearActivity(next: YearActivityFilter) {
    setParams(
      {
        yearActivity: next === 'all' ? undefined : next,
        q: undefined,
      },
      { resetPage: true },
    )
    setTerm('')
  }

  function confirmActivateAll() {
    const count = statsQuery.data?.inactive ?? 0
    if (count <= 0) {
      toast.message(t('accommodationYearManagement.activateAllEmpty'))
      return
    }
    confirmToast({
      title: t('accommodationYearManagement.confirmActivateAll', {
        count: formatNumber(count, locale),
        year: formatNumber(manageYear, locale),
      }),
      confirmLabel: t('accommodationYearManagement.activateAllConfirm'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await activateAllMutation.mutateAsync()
        } catch {
          // toast from mutation
        }
      },
    })
  }

  function confirmDeactivateAll() {
    const count = statsQuery.data?.active ?? 0
    if (count <= 0) {
      toast.message(t('accommodationYearManagement.deactivateAllEmpty'))
      return
    }
    confirmToast({
      title: t('accommodationYearManagement.confirmDeactivateAll', {
        count: formatNumber(count, locale),
        year: formatNumber(manageYear, locale),
      }),
      confirmLabel: t('accommodationYearManagement.deactivateAllConfirm'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await deactivateAllMutation.mutateAsync()
        } catch {
          // toast from mutation
        }
      },
    })
  }

  function confirmRemove(item: AccommodationYearRow) {
    confirmToast({
      title: t('accommodationYearManagement.confirmRemove', {
        year: formatNumber(manageYear, locale),
      }),
      confirmLabel: t('accommodationYearManagement.removeConfirm'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        setPendingId(item.id)
        try {
          await removeMutation.mutateAsync(item.id)
        } catch {
          // toast from mutation
        }
      },
    })
  }

  function confirmAdd(item: AccommodationYearRow) {
    setPendingId(item.id)
    addMutation.mutate(item.id)
  }

  function confirmTransfer(all: boolean) {
    const count = all ? transferTotal : selected.size
    if (!all && selected.size === 0) {
      toast.error(t('accommodationYearManagement.selectRequired'))
      return
    }
    confirmToast({
      title: t(
        all
          ? 'accommodationYearManagement.confirmTransferAll'
          : 'accommodationYearManagement.confirmTransferSelected',
        {
          count: formatNumber(count, locale),
          source: formatNumber(sourceYear, locale),
          target: formatNumber(currentYear, locale),
        },
      ),
      confirmLabel: t('accommodationYearManagement.transferConfirm'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await transferMutation.mutateAsync(
            all ? { all: true } : { accommodationIds: [...selected] },
          )
        } catch {
          // toast from mutation
        }
      },
    })
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(transferItems.map((item) => item.id)))
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function manageEmptyText() {
    if (q) return t('accommodationYearManagement.noResults')
    if (yearActivity === 'active') return t('accommodationYearManagement.emptyActive')
    if (yearActivity === 'inactive') return t('accommodationYearManagement.emptyInactive')
    return t('accommodationYearManagement.emptyAll')
  }

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.accommodationYearManagement')}
        subtitle={t('accommodationYearManagement.subtitle')}
      />

      <YearTabNav tab={tab} onChange={setTab} />

      {tab === 'manage' ? (
        <>
          <article className={`${cardClassName} p-4 sm:p-5`}>
            <div className="max-w-xs">
              <FormField
                icon={CalendarDays}
                label={t('accommodationYearManagement.year')}
                htmlFor="year-manage"
              >
                <SearchSelect
                  id="year-manage"
                  value={String(manageYear)}
                  placeholder={t('accommodationYearManagement.yearPlaceholder')}
                  onChange={(next) =>
                    setParams({ year: next || undefined }, { resetPage: true })
                  }
                  options={persianYearOptions(locale, manageYear)}
                />
              </FormField>
            </div>
          </article>

          {statsQuery.isLoading && !statsQuery.data ? (
            <LoadingState />
          ) : (
            <YearStatsCards
              stats={statsQuery.data}
              locale={locale}
              year={manageYear}
              onActivateAllInactive={confirmActivateAll}
              onDeactivateAllActive={confirmDeactivateAll}
              activatingAll={activateAllMutation.isPending}
              deactivatingAll={deactivateAllMutation.isPending}
            />
          )}

          <ActivityFilterBar
            activity={yearActivity}
            stats={statsQuery.data}
            locale={locale}
            year={manageYear}
            onChange={setYearActivity}
          />

          <div className="space-y-3">
            <SearchBar
              inputId="year-manage-search"
              term={term}
              onTermChange={setTerm}
              onSubmit={() => applySearch()}
              label={t('common.search')}
              placeholder={t('accommodationYearManagement.searchPlaceholder')}
            />

            <TableCard
              loading={manageListQuery.isLoading && !manageListQuery.data}
              hasRows={manageItems.length > 0}
              rowClick={false}
              empty={manageEmptyText()}
            >
              <div className={manageListQuery.isFetching ? 'opacity-70 transition-opacity' : ''}>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-cream-50 text-ink-600">
                  <tr>
                    <th className="w-12 px-3 py-3 text-start font-medium">
                      <span className="sr-only">
                        {t('accommodationYearManagement.yearStatus')}
                      </span>
                    </th>
                    <SortableTh
                      column="name"
                      label={t('accommodations.name')}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                    <SortableTh
                      column="type"
                      label={t('accommodations.type')}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                    <th className="px-4 py-3 text-start font-medium">
                      {t('accommodationYearManagement.yearStatus')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('accommodations.managerName')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {manageItems.map((item) => {
                    const busy = pendingId === item.id
                    return (
                      <tr key={item.id} className="border-b border-line/70 last:border-0">
                        <td className="px-3 py-3">
                          {item.activeInYear ? (
                            <span
                              className="inline-flex size-7 items-center justify-center rounded-full bg-teal-500 text-white shadow-sm"
                              title={t('accommodationYearManagement.statusActive')}
                            >
                              <Check className="size-4 stroke-[3]" aria-hidden />
                              <span className="sr-only">
                                {t('accommodationYearManagement.statusActive')}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-block size-7" aria-hidden />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/accommodations/${item.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{t(`accommodationTypes.${item.type}`)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.activeInYear
                                ? 'bg-teal-50 text-teal-800'
                                : 'bg-cream-100 text-ink-600'
                            }`}
                          >
                            {item.activeInYear
                              ? t('accommodationYearManagement.statusActive')
                              : t('accommodationYearManagement.statusInactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.activeInYear
                            ? managerLabel(
                                item,
                                manageYear,
                                t('accommodations.unassignedManager'),
                              )
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {item.activeInYear ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-700"
                              disabled={busy}
                              onClick={() => confirmRemove(item)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              {t('accommodationYearManagement.removeFromYear', {
                                year: formatNumber(manageYear, locale),
                              })}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-teal-700"
                              disabled={busy}
                              onClick={() => confirmAdd(item)}
                            >
                              <Plus className="size-4" aria-hidden />
                              {t('accommodationYearManagement.addToYear', {
                                year: formatNumber(manageYear, locale),
                              })}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </TableCard>

            <PaginationBar
              page={page}
              pageSize={managePageSize}
              total={manageTotal}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : (
        <>
          <article className={`${cardClassName} grid gap-4 p-4 sm:grid-cols-2 sm:p-5`}>
            <FormField
              icon={CalendarDays}
              label={t('accommodationYearManagement.sourceYear')}
              htmlFor="year-source"
            >
              <SearchSelect
                id="year-source"
                value={String(sourceYear)}
                placeholder={t('accommodationYearManagement.yearPlaceholder')}
                onChange={(next) =>
                  setParams({ sourceYear: next || undefined }, { resetPage: true })
                }
                options={persianYearOptions(locale, sourceYear)}
              />
            </FormField>
            <FormField
              icon={ArrowLeftRight}
              label={t('accommodationYearManagement.targetYear')}
              htmlFor="year-target"
            >
              <div
                id="year-target"
                className="flex h-11 items-center rounded-2xl border border-line bg-cream-50 px-3 text-sm font-medium text-ink-800"
              >
                {formatNumber(currentYear, locale)}
              </div>
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                icon={UserRound}
                label={t('accommodationYearManagement.copyManagers')}
                htmlFor="copy-managers"
              >
                <ToggleField
                  id="copy-managers"
                  checked={copyManagers}
                  onChange={setCopyManagers}
                  onLabel={t('accommodationYearManagement.copyManagersOn')}
                  offLabel={t('accommodationYearManagement.copyManagersOff')}
                />
              </FormField>
            </div>
          </article>

          {statsQuery.isLoading && !statsQuery.data ? (
            <LoadingState />
          ) : (
            <YearStatsCards
              stats={statsQuery.data}
              locale={locale}
              year={sourceYear}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={transferMutation.isPending || transferTotal === 0}
              onClick={() => confirmTransfer(true)}
            >
              <ArrowLeftRight className="size-4" aria-hidden />
              {t('accommodationYearManagement.transferAll', {
                source: formatNumber(sourceYear, locale),
                target: formatNumber(currentYear, locale),
              })}
            </Button>
            <Button
              type="button"
              variant="soft"
              disabled={transferMutation.isPending || selected.size === 0}
              onClick={() => confirmTransfer(false)}
            >
              <ArrowLeftRight className="size-4" aria-hidden />
              {t('accommodationYearManagement.transferSelected', {
                count: formatNumber(selected.size, locale),
                source: formatNumber(sourceYear, locale),
                target: formatNumber(currentYear, locale),
              })}
            </Button>
          </div>

          <div className="space-y-3">
            <SearchBar
              inputId="year-transfer-search"
              term={term}
              onTermChange={setTerm}
              onSubmit={() => applySearch()}
              label={t('common.search')}
              placeholder={t('accommodationYearManagement.searchPlaceholder')}
            />

            <TableCard
              loading={transferListQuery.isLoading && !transferListQuery.data}
              hasRows={transferItems.length > 0}
              rowClick={false}
              empty={
                q
                  ? t('accommodationYearManagement.noResults')
                  : t('accommodationYearManagement.emptySource')
              }
            >
              <div className={transferListQuery.isFetching ? 'opacity-70 transition-opacity' : ''}>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-cream-50 text-ink-600">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      <CheckboxField
                        id="select-all-year"
                        compact
                        checked={allSelected}
                        onChange={toggleAll}
                        label={t('accommodationYearManagement.selectAll')}
                      />
                    </th>
                    <SortableTh
                      column="name"
                      label={t('accommodations.name')}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                    <SortableTh
                      column="type"
                      label={t('accommodations.type')}
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                    <th className="px-4 py-3 text-start font-medium">
                      {t('accommodations.managerName')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transferItems.map((item) => (
                    <tr key={item.id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3">
                        <CheckboxField
                          id={`select-${item.id}`}
                          compact
                          checked={selected.has(item.id)}
                          onChange={(checked) => toggleOne(item.id, checked)}
                          label={item.name}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-900">{item.name}</td>
                      <td className="px-4 py-3">{t(`accommodationTypes.${item.type}`)}</td>
                      <td className="px-4 py-3">
                        {managerLabel(
                          item,
                          sourceYear,
                          t('accommodations.unassignedManager'),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </TableCard>

            <PaginationBar
              page={page}
              pageSize={transferPageSize}
              total={transferTotal}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
