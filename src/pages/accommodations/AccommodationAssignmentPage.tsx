import { Building2, CircleOff, UserRound, UserRoundCheck, UserRoundPlus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField, PageHeader, cardClassName, listShellClassName } from '../../components/ui/Form'
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
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type {
  AccommodationAssignmentList,
  AccommodationAssignmentRow,
  AccommodationAssignmentStats,
  ManagedUser,
} from '../../types/app'

type ManagerFilter = '' | 'with' | 'without'

function parseManagerStatus(raw: string | null): ManagerFilter {
  if (raw === 'with' || raw === 'without') return raw
  return ''
}

function AssignmentStatsCards({
  stats,
  locale,
  filter,
  onSelect,
}: {
  stats: AccommodationAssignmentStats | undefined
  locale: string
  filter: ManagerFilter
  onSelect: (next: ManagerFilter) => void
}) {
  const { t } = useTranslation()
  const cards = [
    {
      key: '' as const,
      icon: Building2,
      tone: 'bg-teal-50 text-teal-700',
      label: t('accommodationAssignment.statAll'),
      value: stats?.total ?? 0,
    },
    {
      key: 'without' as const,
      icon: CircleOff,
      tone: 'bg-cream-100 text-ink-600',
      label: t('accommodationAssignment.statWithout'),
      value: stats?.withoutManager ?? 0,
    },
    {
      key: 'with' as const,
      icon: UserRoundCheck,
      tone: 'bg-mint-50 text-mint-800',
      label: t('accommodationAssignment.statWith'),
      value: stats?.withManager ?? 0,
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const selected = filter === card.key
        return (
          <button
            key={card.key || 'all'}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(card.key)}
            className={`${cardClassName} flex cursor-pointer items-center gap-4 p-5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              selected
                ? 'ring-2 ring-teal-400 shadow-[0_10px_28px_rgba(46,189,182,0.18)]'
                : 'hover:border-teal-200'
            }`}
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}
            >
              <card.icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm leading-6 text-ink-500">{card.label}</span>
              <span className="mt-1 block text-2xl font-semibold text-ink-900">
                {formatNumber(card.value, locale)}
              </span>
            </span>
          </button>
        )
      })}
    </section>
  )
}

function ManagerAssignSelect({
  item,
  year,
  users,
  usersLoading,
}: {
  item: AccommodationAssignmentRow
  year: number
  users: ManagedUser[]
  usersLoading: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const saved = item.managerUserId ?? ''
  const [value, setValue] = useState(saved)

  useEffect(() => {
    setValue(saved)
  }, [saved])

  const assign = useMutation({
    mutationFn: async (next: string) => {
      await api.post(`/accommodations/${item.id}/managers`, {
        userId: next || null,
        year,
        ...(next
          ? {}
          : {
              maleCapacity: item.maleCapacity,
              femaleCapacity: item.femaleCapacity,
            }),
      })
      return next
    },
    onSuccess: async (next) => {
      toast.success(
        t(next ? 'accommodationAssignment.assigned' : 'accommodationAssignment.cleared'),
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accommodation-assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['accommodations'] }),
        queryClient.invalidateQueries({ queryKey: ['accommodation-managers'] }),
      ])
    },
    onError: (error) => {
      setValue(saved)
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const options = useMemo(() => {
    const list = [
      { value: '', label: t('accommodationAssignment.withoutManager') },
      ...users.map((user) => ({
        value: user.id,
        label: `${user.fullName} — ${user.username}`,
      })),
    ]
    if (item.managerUserId && !list.some((option) => option.value === item.managerUserId)) {
      list.push({
        value: item.managerUserId,
        label: item.managerName || item.managerUserId,
      })
    }
    return list
  }, [item.managerName, item.managerUserId, t, users])

  return (
    <SearchSelect
      id={`assignment-manager-${item.id}`}
      value={value}
      disabled={usersLoading || assign.isPending}
      placeholder={t('accommodationAssignment.selectManager')}
      onChange={(next) => {
        if (next === value || assign.isPending) return
        setValue(next)
        assign.mutate(next)
      }}
      options={options}
    />
  )
}

export function AccommodationAssignmentPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const managerStatus = parseManagerStatus(searchParams.get('managerStatus'))

  const statsQuery = useQuery({
    queryKey: ['accommodation-assignments', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AccommodationAssignmentStats>(
        '/accommodations/assignments/stats',
      )
      return data
    },
  })

  const listParams = {
    page,
    ...(q ? { q } : {}),
    ...(managerStatus ? { managerStatus } : {}),
    ...sortParams,
  }

  const listQuery = useQuery({
    queryKey: ['accommodation-assignments', 'list', q, managerStatus, sortBy, sortDir, page],
    queryFn: async () => {
      const { data } = await api.get<AccommodationAssignmentList>('/accommodations/assignments', {
        params: listParams,
      })
      return data
    },
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'lookup', 'ACCOMMODATION_MANAGER'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'ACCOMMODATION_MANAGER' },
      })
      return data
    },
  })

  const managers = useMemo(
    () =>
      [...(usersQuery.data ?? [])].sort((a, b) => a.fullName.localeCompare(b.fullName, locale)),
    [locale, usersQuery.data],
  )

  const rows = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const pageSize = listQuery.data?.pageSize ?? 10
  const year = listQuery.data?.year ?? statsQuery.data?.year

  function setManagerStatus(next: ManagerFilter) {
    setParams({ managerStatus: next || undefined }, { resetPage: true })
  }

  function emptyText() {
    if (q) return t('accommodationAssignment.noResults')
    if (managerStatus === 'with') return t('accommodationAssignment.emptyWith')
    if (managerStatus === 'without') return t('accommodationAssignment.emptyWithout')
    return t('accommodationAssignment.emptyAll')
  }

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        icon={UserRoundPlus}
        title={t('menus.accommodationAssignment')}
        subtitle={t('accommodationAssignment.subtitle', {
          year: formatNumber(statsQuery.data?.year ?? currentPersianYear(), locale),
        })}
      />

      <AssignmentStatsCards
        stats={statsQuery.data}
        locale={locale}
        filter={managerStatus}
        onSelect={setManagerStatus}
      />

      <div className="space-y-3">
        <SearchBar
          inputId="accommodation-assignment-search"
          term={term}
          onTermChange={setTerm}
          onSubmit={() => applySearch()}
          label={t('common.search')}
          placeholder={t('accommodationAssignment.searchPlaceholder')}
          filtersActive={Boolean(managerStatus)}
          extra={
            <FormField
              icon={UserRound}
              label={t('accommodationAssignment.filterLabel')}
              htmlFor="accommodation-assignment-filter"
            >
              <SearchSelect
                id="accommodation-assignment-filter"
                value={managerStatus}
                placeholder={t('accommodationAssignment.filterAll')}
                onChange={(next) => setManagerStatus(parseManagerStatus(next))}
                options={[
                  { value: '', label: t('accommodationAssignment.filterAll') },
                  { value: 'without', label: t('accommodationAssignment.filterWithout') },
                  { value: 'with', label: t('accommodationAssignment.filterWith') },
                ]}
              />
            </FormField>
          }
        />

        <TableCard
          loading={listQuery.isLoading && !listQuery.data}
          hasRows={rows.length > 0}
          empty={emptyText()}
          rowClick={false}
        >
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <SortableTh
                  column="name"
                  label={t('accommodations.name')}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  column="city"
                  label={t('geo.city')}
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
                <th className="w-72 min-w-56 px-4 py-3 text-start font-medium">
                  {t('accommodationAssignment.manager')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link
                      to={`/accommodations/${item.id}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{item.city ? name(item.city) : '—'}</span>
                    {item.province ? (
                      <span className="mt-0.5 block text-xs text-ink-500">{name(item.province)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{t(`accommodationTypes.${item.type}`)}</td>
                  <td className="w-72 min-w-56 px-4 py-3">
                    {year != null ? (
                      <ManagerAssignSelect
                        item={item}
                        year={year}
                        users={managers}
                        usersLoading={usersQuery.isLoading}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}
