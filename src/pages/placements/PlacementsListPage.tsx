import { CalendarDays, Download, Filter, LayoutGrid, LogOut, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { FormMetaChip } from '../../components/ui/FormLayout'
import {
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { confirmToast } from '../../components/ui/confirmToast'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import {
  placementModes,
  placementStatuses,
  reservationTypes,
  type Paginated,
  type PlacementMode,
  type PlacementQueueItem,
  type PlacementStatus,
  type ReservationType,
} from '../../types/app'
import { HeadcountPills } from '../reservations/HeadcountPills'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { PlacementStatusBadge, ReservationTypeBadge } from '../reservations/ReservationStatusBadge'

const typeOrder: ReservationType[] = [
  reservationTypes.INDIVIDUAL,
  reservationTypes.GROUP,
  reservationTypes.CARAVAN,
]

const statusOrder: PlacementStatus[] = [
  placementStatuses.PENDING,
  placementStatuses.PARTIAL,
  placementStatuses.PLACED,
]

export function PlacementsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const n = (value: number) => formatNumber(value, locale)
  const [exporting, setExporting] = useState(false)
  const { q, page, term, setTerm, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const currentYear = String(currentPersianYear())
  const year = searchParams.get('year') || currentYear
  const type = (searchParams.get('type') ?? '') as ReservationType | ''
  const placementStatus = (searchParams.get('placementStatus') ?? '') as PlacementStatus | ''
  const placementMode = (searchParams.get('placementMode') ?? '') as PlacementMode | ''
  const filtersActive = Boolean(type || placementStatus || placementMode || (year && year !== currentYear))

  const listParams = {
    page,
    ...(q ? { q } : {}),
    ...(year ? { year } : {}),
    ...(type ? { type } : {}),
    ...(placementStatus ? { placementStatus } : {}),
    ...(placementMode ? { placementMode } : {}),
    ...sortParams,
  }

  const query = useQuery({
    queryKey: ['placements', 'queue', listParams],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PlacementQueueItem>>('/placements/queue', {
        params: listParams,
      })
      return data
    },
  })

  async function downloadExcel() {
    setExporting(true)
    try {
      const { data } = await api.get<Blob>('/placements/queue/export', {
        params: listParams,
        responseType: 'blob',
      })
      const blob = data instanceof Blob ? data : new Blob([data])
      if (blob.type.includes('json')) {
        const text = await blob.text()
        const parsed = JSON.parse(text) as { message?: string }
        toast.error(parsed.message || t('common.error'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'placements.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('placements.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(false)
    }
  }

  function allocateSystem() {
    confirmToast({
      title: t('placements.confirmAllocateSystem'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          const { data } = await api.post<{ created: number }>('/placements/allocate-system', {
            ...(q ? { q } : {}),
            ...(year ? { year: Number(year) } : {}),
            ...(type ? { type } : {}),
            ...(placementStatus ? { placementStatus } : {}),
          })
          toast.success(t('placements.allocatedSystem', { count: n(data.created) }))
          void queryClient.invalidateQueries({ queryKey: ['placements'] })
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const pageSize = query.data?.pageSize ?? 10

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.placement')}
        subtitle={t('placements.subtitle')}
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('common.search')}
        placeholder={t('placements.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair>
            <FormField icon={LayoutGrid} label={t('reservations.year')} htmlFor="placement-year">
              <SearchSelect
                id="placement-year"
                value={year}
                placeholder={t('accommodations.allYears')}
                onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                options={persianYearOptions(locale, year ? Number(year) : undefined)}
              />
            </FormField>
            <FormField icon={Filter} label={t('reservations.type')} htmlFor="placement-type">
              <SearchSelect
                id="placement-type"
                value={type}
                placeholder={t('common.all')}
                onChange={(next) => setParams({ type: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('common.all') },
                  ...typeOrder.map((item) => ({
                    value: item,
                    label: t(`reservations.types.${item}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('placements.status')} htmlFor="placement-status">
              <SearchSelect
                id="placement-status"
                value={placementStatus}
                placeholder={t('placements.allStatuses')}
                onChange={(next) =>
                  setParams({ placementStatus: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('placements.allStatuses') },
                  ...statusOrder.map((item) => ({
                    value: item,
                    label: t(`placements.statuses.${item}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('receptionSettings.placement')} htmlFor="placement-mode">
              <SearchSelect
                id="placement-mode"
                value={placementMode}
                placeholder={t('placements.allModes')}
                onChange={(next) =>
                  setParams({ placementMode: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('placements.allModes') },
                  { value: placementModes.SYSTEM, label: t('reservations.placementModes.SYSTEM') },
                  { value: placementModes.MANUAL, label: t('reservations.placementModes.MANUAL') },
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('placements.noResults') : t('placements.empty')}
        hasRows={items.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="createdAt" label={t('reservations.code')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="party"
                label={t('caravans.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[14rem] w-[22%]"
              />
              <SortableTh
                column="caravanManager"
                label={t('reservations.caravanManager')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[12rem] w-[18%]"
              />
              <SortableTh
                column="type"
                label={t('reservations.type')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
              />
              <SortableTh column="totalCount" label={t('placements.headcount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-start font-medium">{t('placements.allocated')}</th>
              <SortableTh column="stayStartDate" label={t('placements.stay')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="placementStatus"
                label={t('placements.status')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
              />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link to={`/placements/${row.id}`} data-row-view className="sr-only">
                    {t('common.view')}
                  </Link>
                  <ReservationCodeBadge code={row.code} size="md" />
                </td>
                <td className="min-w-[14rem] w-[22%] px-4 py-3">{row.caravan?.name ?? '—'}</td>
                <td className="min-w-[12rem] w-[18%] px-4 py-3">{row.caravanManager?.fullName ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <ReservationTypeBadge type={row.type} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <HeadcountPills
                    type={row.type}
                    male={row.maleCount}
                    female={row.femaleCount}
                    total={row.totalCount}
                    format={n}
                    maleLabel={t('reservations.countMale')}
                    femaleLabel={t('reservations.countFemale')}
                    totalLabel={t('reservations.countTotal')}
                  />
                </td>
                <td className="px-4 py-3">
                  <HeadcountPills
                    type={reservationTypes.GROUP}
                    male={row.allocatedMale}
                    female={row.allocatedFemale}
                    total={row.allocatedMale + row.allocatedFemale}
                    format={n}
                    maleLabel={t('reservations.countMale')}
                    femaleLabel={t('reservations.countFemale')}
                    totalLabel={t('reservations.countTotal')}
                    showTotal={false}
                  />
                </td>
                <td className="px-4 py-3">
                  {row.stayStartDate || row.stayEndDate ? (
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap" dir="ltr">
                      {row.stayStartDate ? (
                        <FormMetaChip icon={CalendarDays} label={<DateText value={row.stayStartDate} />} />
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                      {row.stayEndDate ? (
                        <FormMetaChip icon={CalendarDays} label={<DateText value={row.stayEndDate} />} />
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <PlacementStatusBadge status={row.placementStatus} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        startExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="soft"
              onClick={allocateSystem}
              disabled={placementMode === placementModes.MANUAL}
            >
              <Sparkles className="size-4" aria-hidden />
              {t('placements.allocateSystem')}
            </Button>
            <Link to="/placements/vacate">
              <Button type="button" variant="ghost">
                <LogOut className="size-4" aria-hidden />
                {t('placements.openVacate')}
              </Button>
            </Link>
            <Button type="button" variant="ghost" onClick={() => void downloadExcel()} disabled={exporting}>
              <Download className="size-4" aria-hidden />
              {exporting ? t('placements.downloadingExcel') : t('placements.downloadExcel')}
            </Button>
          </div>
        }
      />
    </div>
  )
}

