import {
  Building2,
  CalendarDays,
  Download,
  Map,
  MapPin,
  Route,
  Tent,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  FormField,
  LoadingState,
  PageHeader,
  cardClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import {
  EntityRowActions,
  SortableTh,
  TableCard,
  nextSortState,
  type SortDir,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import { useAuth } from '../../auth/AuthProvider'
import type {
  NationalMonitoringCity,
  NationalMonitoringPlace,
  NationalMonitoringReport,
  NationalMonitoringRoute,
} from '../../types/app'
import {
  downloadMonitoringExcel,
  parseMonitorYear,
  VerticalMonitorBarChart,
  yearQuery,
} from '../provincial-monitoring/monitoringShared'

type ExportSection = 'province' | 'city' | 'route'

function sortRows<T>(
  rows: T[],
  sortBy: string,
  sortDir: SortDir | '',
  valueOf: (row: T, key: string) => string | number,
) {
  if (!sortBy || !sortDir) return rows
  return [...rows].sort((a, b) => {
    const av = valueOf(a, sortBy)
    const bv = valueOf(b, sortBy)
    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'fa')
    return sortDir === 'asc' ? cmp : -cmp
  })
}

export function NationalMonitoringPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const { user } = useAuth()
  const canProvincial = hasMenuAccess('/provincial-monitoring', user?.modules ?? [])
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseMonitorYear(yearFromUrl, currentYear)
  const [exporting, setExporting] = useState<ExportSection | null>(null)
  const [provinceSort, setProvinceSort] = useState({ by: 'pilgrims', dir: 'desc' as SortDir | '' })
  const [citySort, setCitySort] = useState({ by: 'pilgrims', dir: 'desc' as SortDir | '' })
  const [routeSort, setRouteSort] = useState({ by: 'pilgrims', dir: 'desc' as SortDir | '' })

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: String(currentYear) })
  }, [currentYear, setParams, yearFromUrl])

  const query = useQuery({
    queryKey: ['national-monitoring', year],
    queryFn: async () => {
      const { data } = await api.get<NationalMonitoringReport>('/national-monitoring', {
        params: { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const data = query.data
  const provinces = useMemo(
    () =>
      sortRows(data?.byProvince ?? [], provinceSort.by, provinceSort.dir, (row, key) => {
        if (key === 'nameFa') return row.nameFa
        if (key === 'accommodationCount') return row.accommodationCount
        if (key === 'lodgingCapacity') return row.lodgingCapacity.total
        if (key === 'lodgingGap') return row.lodgingGap
        if (key === 'caravanCount') return row.caravanCount
        return row.pilgrims
      }),
    [data, provinceSort],
  )
  const cities = useMemo(
    () =>
      sortRows(data?.byCity ?? [], citySort.by, citySort.dir, (row, key) => {
        if (key === 'nameFa') return row.nameFa
        if (key === 'provinceNameFa') return row.provinceNameFa
        if (key === 'accommodationCount') return row.accommodationCount
        if (key === 'lodgingCapacity') return row.lodgingCapacity.total
        if (key === 'lodgingGap') return row.lodgingGap
        return row.pilgrims
      }),
    [data, citySort],
  )
  const routes = useMemo(
    () =>
      sortRows(data?.byWalkingRoute ?? [], routeSort.by, routeSort.dir, (row, key) => {
        if (key === 'name') return row.name || t('nationalMonitoring.routeUnspecified')
        if (key === 'caravanCount') return row.caravanCount
        if (key === 'groupCount') return row.groupCount
        return row.pilgrims
      }),
    [data, routeSort, t],
  )

  async function exportExcel(section: ExportSection) {
    setExporting(section)
    try {
      await downloadMonitoringExcel(
        `/national-monitoring/export?year=${year}&section=${section}`,
        `national-monitoring-${section}.xlsx`,
      )
      toast.success(t('nationalMonitoring.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(null)
    }
  }

  function routeName(row: NationalMonitoringRoute) {
    return row.name || t('nationalMonitoring.routeUnspecified')
  }

  if (query.isLoading && !data) {
    return <LoadingState />
  }
  if (!data) {
    return <LoadingState />
  }

  const totals = data.totals
  const highlights = data.highlights

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.nationalMonitoring')}
        subtitle={t('nationalMonitoring.subtitle')}
      />
      <div className="space-y-6">
        <article className={`${cardClassName} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="max-w-xs min-w-56 flex-1">
              <FormField icon={CalendarDays} label={t('nationalMonitoring.year')} htmlFor="nm-year">
                <SearchSelect
                  id="nm-year"
                  value={String(year)}
                  onChange={(next) => setParams({ year: next || undefined })}
                  options={persianYearOptions(locale, year)}
                  placeholder={t('nationalMonitoring.year')}
                />
              </FormField>
            </div>
            {canProvincial ? (
              <Link to={`/provincial-monitoring?${yearQuery(year)}`}>
                <Button type="button" variant="soft">
                  <Map className="size-4" aria-hidden />
                  {t('menus.provincialMonitoring')}
                </Button>
              </Link>
            ) : null}
          </div>
        </article>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
          <HighlightTile
            icon={Map}
            label={t('nationalMonitoring.busiestProvince')}
            name={highlights.busiestProvince?.nameFa}
            value={highlights.busiestProvince?.pilgrims ?? 0}
            locale={locale}
            empty={t('nationalMonitoring.noHighlight')}
            onClick={
              highlights.busiestProvince && canProvincial
                ? () =>
                    navigate(
                      `/provincial-monitoring/provinces/${highlights.busiestProvince!.id}?${yearQuery(year)}`,
                    )
                : undefined
            }
          />
          <HighlightTile
            icon={MapPin}
            label={t('nationalMonitoring.busiestCity')}
            name={highlights.busiestCity?.nameFa}
            value={highlights.busiestCity?.pilgrims ?? 0}
            locale={locale}
            empty={t('nationalMonitoring.noHighlight')}
            onClick={
              highlights.busiestCity && canProvincial
                ? () =>
                    navigate(
                      `/provincial-monitoring/cities/${highlights.busiestCity!.id}?${yearQuery(year)}`,
                    )
                : undefined
            }
          />
          <HighlightTile
            icon={Route}
            label={t('nationalMonitoring.busiestRoute')}
            name={highlights.busiestRoute?.name}
            value={highlights.busiestRoute?.pilgrims ?? 0}
            locale={locale}
            empty={t('nationalMonitoring.noHighlight')}
          />
          <HighlightTile
            icon={Building2}
            label={t('nationalMonitoring.tightestProvince')}
            name={highlights.tightestProvince?.nameFa}
            value={highlights.tightestProvince?.lodgingGap ?? 0}
            locale={locale}
            empty={t('nationalMonitoring.noHighlight')}
            signed
            onClick={
              highlights.tightestProvince && canProvincial
                ? () =>
                    navigate(
                      `/provincial-monitoring/provinces/${highlights.tightestProvince!.id}?${yearQuery(year)}`,
                    )
                : undefined
            }
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
          <FormFactTile
            icon={Users}
            label={t('nationalMonitoring.pilgrims')}
            value={formatNumber(totals.pilgrims, locale)}
            tone="teal"
          />
          <FormFactTile
            icon={Users}
            label={t('nationalMonitoring.male')}
            value={formatNumber(totals.pilgrimMale, locale)}
            tone="mint"
          />
          <FormFactTile
            icon={Users}
            label={t('nationalMonitoring.female')}
            value={formatNumber(totals.pilgrimFemale, locale)}
            tone="mint"
          />
          <FormFactTile
            icon={Tent}
            label={t('nationalMonitoring.caravans')}
            value={formatNumber(totals.caravanCount, locale)}
            tone="teal"
          />
          <FormFactTile
            icon={Building2}
            label={t('nationalMonitoring.accommodations')}
            value={formatNumber(totals.accommodationCount, locale)}
            tone="ink"
          />
          <FormFactTile
            icon={Building2}
            label={t('nationalMonitoring.lodgingCapacity')}
            value={formatNumber(totals.lodgingCapacity.total, locale)}
            tone="ink"
          />
        </div>

        <FormCard icon={Map} title={t('nationalMonitoring.byProvince')}>
          <div className="space-y-4 p-5 sm:p-6">
            <VerticalMonitorBarChart
              locale={locale}
              seriesName={t('nationalMonitoring.pilgrims')}
              unitLabel={t('nationalMonitoring.count')}
              onItemClick={
                canProvincial
                  ? (item) =>
                      navigate(
                        `/provincial-monitoring/provinces/${item.key}?${yearQuery(year)}`,
                      )
                  : undefined
              }
              data={data.byProvince
                .filter((row) => row.pilgrims > 0)
                .map((row) => ({
                  key: row.id,
                  name: row.nameFa,
                  value: row.pilgrims,
                }))}
            />
            <PlaceTable
              rows={provinces}
              sortBy={provinceSort.by}
              sortDir={provinceSort.dir}
              onSort={(column) => {
                const next = nextSortState(column, provinceSort.by, provinceSort.dir)
                setProvinceSort({ by: next.sortBy ?? '', dir: next.sortDir ?? '' })
              }}
              locale={locale}
              viewTo={(row) => `/provincial-monitoring/provinces/${row.id}?${yearQuery(year)}`}
              showView={canProvincial}
              onExport={() => exportExcel('province')}
              exporting={exporting === 'province'}
            />
          </div>
        </FormCard>

        <FormCard icon={MapPin} title={t('nationalMonitoring.byCity')}>
          <div className="space-y-4 p-5 sm:p-6">
            <VerticalMonitorBarChart
              locale={locale}
              seriesName={t('nationalMonitoring.pilgrims')}
              unitLabel={t('nationalMonitoring.count')}
              onItemClick={
                canProvincial
                  ? (item) =>
                      navigate(
                        `/provincial-monitoring/cities/${item.key}?${yearQuery(year)}`,
                      )
                  : undefined
              }
              data={data.byCity
                .filter((row) => row.pilgrims > 0)
                .map((row) => ({
                  key: row.id,
                  name: row.nameFa,
                  value: row.pilgrims,
                }))}
            />
            <CityTable
              rows={cities}
              sortBy={citySort.by}
              sortDir={citySort.dir}
              onSort={(column) => {
                const next = nextSortState(column, citySort.by, citySort.dir)
                setCitySort({ by: next.sortBy ?? '', dir: next.sortDir ?? '' })
              }}
              locale={locale}
              viewTo={(row) => `/provincial-monitoring/cities/${row.id}?${yearQuery(year)}`}
              showView={canProvincial}
              onExport={() => exportExcel('city')}
              exporting={exporting === 'city'}
            />
          </div>
        </FormCard>

        <FormCard icon={Route} title={t('nationalMonitoring.byRoute')}>
          <div className="space-y-4 p-5 sm:p-6">
            <VerticalMonitorBarChart
              locale={locale}
              seriesName={t('nationalMonitoring.pilgrims')}
              unitLabel={t('nationalMonitoring.count')}
              data={data.byWalkingRoute
                .filter((row) => row.pilgrims > 0)
                .map((row) => ({
                  key: row.id ?? undefined,
                  name: routeName(row),
                  value: row.pilgrims,
                }))}
            />
            <RouteTable
              rows={routes}
              sortBy={routeSort.by}
              sortDir={routeSort.dir}
              onSort={(column) => {
                const next = nextSortState(column, routeSort.by, routeSort.dir)
                setRouteSort({ by: next.sortBy ?? '', dir: next.sortDir ?? '' })
              }}
              locale={locale}
              routeName={routeName}
              onExport={() => exportExcel('route')}
              exporting={exporting === 'route'}
            />
          </div>
        </FormCard>
      </div>
    </div>
  )
}

function HighlightTile({
  icon: Icon,
  label,
  name,
  value,
  locale,
  empty,
  onClick,
  signed = false,
}: {
  icon: LucideIcon
  label: string
  name?: string
  value: number
  locale: string
  empty: string
  onClick?: () => void
  signed?: boolean
}) {
  const display =
    signed && value !== 0
      ? `${value > 0 ? '+' : '−'}${formatNumber(Math.abs(value), locale)}`
      : formatNumber(value, locale)
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={`rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-3 text-start ${
        onClick ? 'cursor-pointer hover:border-teal-300' : 'cursor-default'
      }`}
    >
      <p className="flex items-center gap-2 text-[11px] font-medium text-ink-500">
        <Icon className="size-3.5 text-teal-600" aria-hidden />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{name || empty}</p>
      <p className="mt-0.5 text-xs font-medium text-teal-800">{display}</p>
    </button>
  )
}

function ExportButton({
  onExport,
  exporting,
  label,
  busyLabel,
}: {
  onExport: () => void
  exporting: boolean
  label: string
  busyLabel: string
}) {
  return (
    <Button type="button" variant="ghost" onClick={onExport} disabled={exporting}>
      <Download className="size-4" aria-hidden />
      {exporting ? busyLabel : label}
    </Button>
  )
}

function PlaceTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  locale,
  viewTo,
  showView,
  onExport,
  exporting,
}: {
  rows: NationalMonitoringPlace[]
  sortBy: string
  sortDir: SortDir | ''
  onSort: (column: string) => void
  locale: string
  viewTo: (row: NationalMonitoringPlace) => string
  showView: boolean
  onExport: () => void
  exporting: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <FormSectionTitle icon={Map}>{t('nationalMonitoring.provinceTable')}</FormSectionTitle>
        <ExportButton
          onExport={onExport}
          exporting={exporting}
          label={t('nationalMonitoring.downloadExcel')}
          busyLabel={t('nationalMonitoring.downloadingExcel')}
        />
      </div>
      <TableCard empty={t('nationalMonitoring.emptyProvinces')} hasRows={rows.length > 0} rowClick={showView}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-cream-50 text-ink-600">
              <tr>
                <SortableTh column="nameFa" label={t('nationalMonitoring.colProvince')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="pilgrims" label={t('nationalMonitoring.pilgrims')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="caravanCount" label={t('nationalMonitoring.caravans')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="accommodationCount" label={t('nationalMonitoring.accommodations')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="lodgingCapacity" label={t('nationalMonitoring.lodgingCapacity')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="lodgingGap" label={t('nationalMonitoring.lodgingGap')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                {showView ? <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 text-start font-medium">{row.nameFa}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.pilgrims, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.caravanCount, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.accommodationCount, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.lodgingCapacity.total, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.lodgingGap, locale)}</td>
                  {showView ? (
                    <td className="px-4 py-3 text-start">
                      <EntityRowActions viewTo={viewTo(row)} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  )
}

function CityTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  locale,
  viewTo,
  showView,
  onExport,
  exporting,
}: {
  rows: NationalMonitoringCity[]
  sortBy: string
  sortDir: SortDir | ''
  onSort: (column: string) => void
  locale: string
  viewTo: (row: NationalMonitoringCity) => string
  showView: boolean
  onExport: () => void
  exporting: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <FormSectionTitle icon={MapPin}>{t('nationalMonitoring.cityTable')}</FormSectionTitle>
        <ExportButton
          onExport={onExport}
          exporting={exporting}
          label={t('nationalMonitoring.downloadExcel')}
          busyLabel={t('nationalMonitoring.downloadingExcel')}
        />
      </div>
      <TableCard empty={t('nationalMonitoring.emptyCities')} hasRows={rows.length > 0} rowClick={showView}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-cream-50 text-ink-600">
              <tr>
                <SortableTh column="nameFa" label={t('nationalMonitoring.colCity')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="provinceNameFa" label={t('nationalMonitoring.colProvince')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="pilgrims" label={t('nationalMonitoring.pilgrims')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="accommodationCount" label={t('nationalMonitoring.accommodations')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="lodgingCapacity" label={t('nationalMonitoring.lodgingCapacity')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="lodgingGap" label={t('nationalMonitoring.lodgingGap')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                {showView ? <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 text-start font-medium">{row.nameFa}</td>
                  <td className="px-4 py-3 text-start">{row.provinceNameFa}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.pilgrims, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.accommodationCount, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.lodgingCapacity.total, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.lodgingGap, locale)}</td>
                  {showView ? (
                    <td className="px-4 py-3 text-start">
                      <EntityRowActions viewTo={viewTo(row)} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  )
}

function RouteTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  locale,
  routeName,
  onExport,
  exporting,
}: {
  rows: NationalMonitoringRoute[]
  sortBy: string
  sortDir: SortDir | ''
  onSort: (column: string) => void
  locale: string
  routeName: (row: NationalMonitoringRoute) => string
  onExport: () => void
  exporting: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <FormSectionTitle icon={Route}>{t('nationalMonitoring.routeTable')}</FormSectionTitle>
        <ExportButton
          onExport={onExport}
          exporting={exporting}
          label={t('nationalMonitoring.downloadExcel')}
          busyLabel={t('nationalMonitoring.downloadingExcel')}
        />
      </div>
      <TableCard empty={t('nationalMonitoring.emptyRoutes')} hasRows={rows.length > 0} rowClick={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-cream-50 text-ink-600">
              <tr>
                <SortableTh column="name" label={t('nationalMonitoring.colRoute')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="pilgrims" label={t('nationalMonitoring.pilgrims')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="caravanCount" label={t('nationalMonitoring.caravans')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <SortableTh column="groupCount" label={t('nationalMonitoring.groups')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id ?? 'none'} className="border-t border-line">
                  <td className="px-4 py-3 text-start font-medium">{routeName(row)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.pilgrims, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.caravanCount, locale)}</td>
                  <td className="px-4 py-3 text-start">{formatNumber(row.groupCount, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  )
}
