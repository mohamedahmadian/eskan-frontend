import {
  CalendarDays,
  Download,
  Mars,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
  Users,
  Venus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Button,
  cardClassName,
  FormField,
  listShellClassName,
  LoadingState,
  PageHeader,
} from '../../components/ui/Form'
import { TableCard } from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatGroupedNumber, formatNumber, persianYearOptions } from '../../lib/datetime'
import type {
  PilgrimReportCityTimeline,
  PilgrimReportGeo,
  PilgrimReportProvinceTimeline,
  PilgrimReportSummary,
  PilgrimReportTimeline,
} from '../../types/app'

const reportViews = ['charts', 'table'] as const
type ReportView = (typeof reportViews)[number]
type ReportExportSection = 'country' | 'province' | 'city' | 'year'
type PlaceKind = 'province' | 'city'

const CHART_COLORS = [
  '#148f8a',
  '#2ebdb6',
  '#5ed4ce',
  '#e8b83a',
  '#f5cd6a',
  '#7a756c',
  '#3d9b96',
  '#c9a227',
]

const UNSPECIFIED_GEO_ID = '__unspecified__'
const UNSPECIFIED_GEO_COLOR = '#9a948a'

const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

function chartValueText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatGroupedNumber(n, locale) : ''
}
const ALL_YEARS = 'all'

function geoDisplayName(id: string, name: string, t: (key: string) => string) {
  if (id === UNSPECIFIED_GEO_ID) return t('pilgrimReports.unspecifiedGeo')
  return name
}

function percentOf(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function yoyLabel(
  changePercent: number | null | undefined,
  t: (key: string, options?: Record<string, string>) => string,
  locale: string,
) {
  if (changePercent == null) return t('pilgrimReports.yoyUnavailable')
  if (changePercent === 0) return t('pilgrimReports.yoyUnchanged')
  const value = formatNumber(Math.abs(changePercent), locale)
  return changePercent > 0
    ? t('pilgrimReports.yoyIncrease', { value })
    : t('pilgrimReports.yoyDecrease', { value })
}

function changeCountLabel(
  changeCount: number | null | undefined,
  t: (key: string, options?: Record<string, string>) => string,
  locale: string,
) {
  if (changeCount == null) return t('pilgrimReports.changeCountUnavailable')
  if (changeCount === 0) return t('pilgrimReports.changeCountUnchanged')
  const value = formatGroupedNumber(Math.abs(changeCount), locale)
  return changeCount > 0
    ? t('pilgrimReports.changeCountIncrease', { value })
    : t('pilgrimReports.changeCountDecrease', { value })
}

function parseYearParam(raw: string | null, fallback: number): number | null {
  if (raw === ALL_YEARS) return null
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

function yearQueryParams(year: number | null) {
  return year == null ? undefined : { year }
}

export function PilgrimsReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYearParam(yearFromUrl, currentYear)
  const yearSelectValue = year == null ? ALL_YEARS : String(year)
  const yearParams = yearQueryParams(year)
  const viewFromUrl = searchParams.get('view')
  const view: ReportView = viewFromUrl === 'table' ? 'table' : 'charts'

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: ALL_YEARS })
  }, [setParams, yearFromUrl])

  const summaryQuery = useQuery({
    queryKey: ['pilgrims', 'report', 'summary', year],
    queryFn: async () => {
      const { data } = await api.get<PilgrimReportSummary>('/pilgrims/report/summary', {
        params: yearParams,
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const geoQuery = useQuery({
    queryKey: ['pilgrims', 'report', 'geo', year],
    queryFn: async () => {
      const { data } = await api.get<PilgrimReportGeo>('/pilgrims/report/geo', {
        params: yearParams,
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const timelineQuery = useQuery({
    queryKey: ['pilgrims', 'report', 'timeline', year],
    queryFn: async () => {
      const { data } = await api.get<PilgrimReportTimeline>('/pilgrims/report/timeline', {
        params: yearParams,
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const [exportingSection, setExportingSection] = useState<ReportExportSection | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<{
    kind: PlaceKind
    id: string
    name: string
  } | null>(null)
  const [exportingPlace, setExportingPlace] = useState(false)

  async function downloadExcel(section: ReportExportSection) {
    setExportingSection(section)
    try {
      const { data } = await api.get<Blob>('/pilgrims/report/export', {
        params: { section, ...yearParams },
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
      link.download = `pilgrims-report-${section}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('pilgrimReports.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExportingSection(null)
    }
  }

  async function downloadPlaceExcel(kind: PlaceKind, placeId: string) {
    setExportingPlace(true)
    try {
      const path =
        kind === 'province'
          ? '/pilgrims/report/province-timeline/export'
          : '/pilgrims/report/city-timeline/export'
      const { data } = await api.get<Blob>(path, {
        params: kind === 'province' ? { provinceId: placeId } : { cityId: placeId },
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
      link.download =
        kind === 'province'
          ? 'pilgrims-report-province-years.xlsx'
          : 'pilgrims-report-city-years.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('pilgrimReports.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExportingPlace(false)
    }
  }

  const summary = summaryQuery.data
  const total = summary?.total ?? 0
  const male = summary?.byGender.male ?? 0
  const female = summary?.byGender.female ?? 0
  const unspecified = summary?.byGender.unspecified ?? 0

  const yearOptions = [
    { value: ALL_YEARS, label: t('pilgrimReports.allYears') },
    ...persianYearOptions(locale, year ?? currentYear),
  ]

  const countryRows = (geoQuery.data?.byCountry ?? []).map((row) => ({
    key: row.id,
    name: geoDisplayName(row.id, row.name, t),
    value: row.count,
    previousCount: row.previousCount,
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))

  const countryPieData = countryRows.map((row, index) => ({
    ...row,
    fill: row.key === UNSPECIFIED_GEO_ID ? UNSPECIFIED_GEO_COLOR : CHART_COLORS[index % CHART_COLORS.length],
  }))

  const provinceRows = (geoQuery.data?.byProvince ?? []).map((row) => ({
    key: row.id,
    name: geoDisplayName(row.id, row.name, t),
    value: row.count,
    previousCount: row.previousCount,
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))

  const provinceBars = provinceRows.map((row, index) => ({
    key: row.key,
    name: row.name,
    value: row.value,
    fill: row.key === UNSPECIFIED_GEO_ID ? UNSPECIFIED_GEO_COLOR : CHART_COLORS[index % CHART_COLORS.length],
  }))

  const cityRows = (geoQuery.data?.byCity ?? []).map((row) => ({
    key: row.id,
    name: geoDisplayName(row.id, row.name, t),
    value: row.count,
    previousCount: row.previousCount,
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))

  const cityBars = cityRows.map((row, index) => ({
    key: row.key,
    name: row.name,
    value: row.value,
    fill: row.key === UNSPECIFIED_GEO_ID ? UNSPECIFIED_GEO_COLOR : CHART_COLORS[index % CHART_COLORS.length],
  }))

  const yearRows = (timelineQuery.data?.byYear ?? []).map((row) => ({
    key: String(row.year),
    name: formatNumber(row.year, locale),
    value: row.count,
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))

  const yearBars = yearRows.map((row) => ({
    name: row.name,
    value: row.value,
    fill: '#2ebdb6',
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))

  const genderKpis = [
    {
      key: 'male',
      icon: Mars,
      tone: 'bg-gold-50 text-gold-600',
      label: t('pilgrimReports.male'),
      value: male,
    },
    {
      key: 'female',
      icon: Venus,
      tone: 'bg-teal-50 text-teal-700',
      label: t('pilgrimReports.female'),
      value: female,
    },
    ...(unspecified > 0
      ? [
          {
            key: 'unspecified',
            icon: Users,
            tone: 'bg-cream-100 text-ink-700',
            label: t('pilgrimReports.unspecifiedGender'),
            value: unspecified,
          },
        ]
      : []),
  ]

  const summaryFetching = summaryQuery.isFetching
  const chartsReady = total > 0

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader title={t('menus.pilgrimsReport')} subtitle={t('pilgrimReports.subtitle')} />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('pilgrimReports.year')} htmlFor="pilgrim-report-year">
            <SearchSelect
              id="pilgrim-report-year"
              value={yearSelectValue}
              placeholder={t('pilgrimReports.selectYear')}
              onChange={(next) => setParams({ year: next })}
              options={yearOptions}
            />
          </FormField>
        </div>
      </article>

      {summaryQuery.isLoading && !summary ? (
        <LoadingState />
      ) : summaryQuery.isError || !summary ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      ) : (
        <div className={`space-y-6 ${summaryFetching ? 'opacity-70' : ''}`}>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Users}
              tone="bg-teal-50 text-teal-700"
              label={t('pilgrimReports.total')}
              value={formatGroupedNumber(total, locale)}
            />
            {genderKpis.map((item) => (
              <KpiCard
                key={item.key}
                icon={item.icon}
                tone={item.tone}
                label={item.label}
                value={formatGroupedNumber(item.value, locale)}
                hint={t('pilgrimReports.percent', {
                  value: formatNumber(percentOf(item.value, total), locale),
                })}
              />
            ))}
          </section>

          {total === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('pilgrimReports.empty')}
            </p>
          ) : (
            <>
              <ReportTabNav view={view} onChange={(next) => setParams({ view: next })} />

              {view === 'charts' ? (
                <div className="space-y-6">
                  <ChartCard
                    title={t('pilgrimReports.byCountry')}
                    onExport={() => void downloadExcel('country')}
                    exporting={exportingSection === 'country'}
                    exportDisabled={countryRows.length === 0}
                  >
                    <SectionBody
                      loading={geoQuery.isLoading && !geoQuery.data}
                      error={geoQuery.isError}
                      empty={chartsReady && countryPieData.length === 0}
                    >
                      <DonutChart data={countryPieData} total={total} locale={locale} />
                    </SectionBody>
                  </ChartCard>

                  <ChartCard
                    title={t('pilgrimReports.byYear')}
                    onExport={() => void downloadExcel('year')}
                    exporting={exportingSection === 'year'}
                    exportDisabled={yearRows.length === 0}
                  >
                    <SectionBody
                      loading={timelineQuery.isLoading && !timelineQuery.data}
                      error={timelineQuery.isError}
                      empty={chartsReady && yearBars.length === 0}
                    >
                      <VerticalBarChart data={yearBars} locale={locale} showGrowth />
                      <YearChangeLegend items={yearBars} locale={locale} />
                    </SectionBody>
                  </ChartCard>

                  <ChartCard
                    title={t('pilgrimReports.byProvince')}
                    subtitle={t('pilgrimReports.provinceYearHint')}
                    onExport={() => void downloadExcel('province')}
                    exporting={exportingSection === 'province'}
                    exportDisabled={provinceRows.length === 0}
                  >
                    <SectionBody
                      loading={geoQuery.isLoading && !geoQuery.data}
                      error={geoQuery.isError}
                      empty={chartsReady && provinceBars.length === 0}
                    >
                      <VerticalBarChart
                        data={provinceBars}
                        locale={locale}
                        height={Math.max(280, provinceBars.length * 28)}
                        onItemClick={(item) =>
                          setSelectedPlace({ kind: 'province', id: item.key, name: item.name })
                        }
                      />
                    </SectionBody>
                  </ChartCard>

                  <ChartCard
                    title={t('pilgrimReports.byCity')}
                    subtitle={t('pilgrimReports.cityYearHint')}
                    onExport={() => void downloadExcel('city')}
                    exporting={exportingSection === 'city'}
                    exportDisabled={cityRows.length === 0}
                  >
                    <SectionBody
                      loading={geoQuery.isLoading && !geoQuery.data}
                      error={geoQuery.isError}
                      empty={chartsReady && cityBars.length === 0}
                    >
                      <VerticalBarChart
                        data={cityBars}
                        locale={locale}
                        height={Math.max(280, cityBars.length * 28)}
                        onItemClick={(item) =>
                          setSelectedPlace({ kind: 'city', id: item.key, name: item.name })
                        }
                      />
                    </SectionBody>
                  </ChartCard>
                </div>
              ) : (
                <div className="space-y-6">
                  <ReportTableCard
                    title={t('pilgrimReports.byCountry')}
                    rows={countryRows}
                    total={total}
                    locale={locale}
                    selectedYear={year}
                    loading={geoQuery.isLoading && !geoQuery.data}
                    error={geoQuery.isError}
                    onExport={() => void downloadExcel('country')}
                    exporting={exportingSection === 'country'}
                  />
                  <YearReportTableCard
                    title={t('pilgrimReports.byYear')}
                    rows={yearRows}
                    locale={locale}
                    loading={timelineQuery.isLoading && !timelineQuery.data}
                    error={timelineQuery.isError}
                    onExport={() => void downloadExcel('year')}
                    exporting={exportingSection === 'year'}
                  />
                  <ReportTableCard
                    title={t('pilgrimReports.byProvince')}
                    subtitle={t('pilgrimReports.provinceYearHint')}
                    nameColumn={t('pilgrimReports.colProvince')}
                    rows={provinceRows}
                    total={total}
                    locale={locale}
                    selectedYear={year}
                    loading={geoQuery.isLoading && !geoQuery.data}
                    error={geoQuery.isError}
                    onExport={() => void downloadExcel('province')}
                    exporting={exportingSection === 'province'}
                    showYoy={year != null}
                    onRowClick={(row) =>
                      setSelectedPlace({ kind: 'province', id: row.key, name: row.name })
                    }
                  />
                  <ReportTableCard
                    title={t('pilgrimReports.byCity')}
                    subtitle={t('pilgrimReports.cityYearHint')}
                    nameColumn={t('pilgrimReports.colCity')}
                    rows={cityRows}
                    total={total}
                    locale={locale}
                    selectedYear={year}
                    loading={geoQuery.isLoading && !geoQuery.data}
                    error={geoQuery.isError}
                    onExport={() => void downloadExcel('city')}
                    exporting={exportingSection === 'city'}
                    showYoy={year != null}
                    onRowClick={(row) =>
                      setSelectedPlace({ kind: 'city', id: row.key, name: row.name })
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedPlace ? (
        <PlaceYearGrowthModal
          kind={selectedPlace.kind}
          placeId={selectedPlace.id}
          placeName={selectedPlace.name}
          locale={locale}
          exporting={exportingPlace}
          onExport={() => void downloadPlaceExcel(selectedPlace.kind, selectedPlace.id)}
          onClose={() => setSelectedPlace(null)}
        />
      ) : null}
    </div>
  )
}

function ReportTabNav({
  view,
  onChange,
}: {
  view: ReportView
  onChange: (view: ReportView) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
      {reportViews.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
            view === item
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
          }`}
        >
          {t(`pilgrimReports.tabs.${item}`)}
        </button>
      ))}
    </nav>
  )
}

function ExcelExportButton({
  onClick,
  exporting,
  disabled,
}: {
  onClick: () => void
  exporting?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Button type="button" variant="ghost" onClick={onClick} disabled={disabled || exporting}>
      <Download className="size-4" aria-hidden />
      {exporting ? t('pilgrimReports.downloadingExcel') : t('pilgrimReports.downloadExcel')}
    </Button>
  )
}

function ClickHintBox({ children }: { children: string }) {
  return (
    <p className="mt-2 flex items-start gap-2.5 rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-3 text-sm font-medium leading-6 text-teal-800">
      <MousePointerClick className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

function SectionTitleRow({
  title,
  subtitle,
  onExport,
  exporting,
  exportDisabled,
}: {
  title: string
  subtitle?: string
  onExport?: () => void
  exporting?: boolean
  exportDisabled?: boolean
}) {
  return (
    <div className="space-y-0">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-sm font-medium text-ink-500">{title}</h2>
        {onExport ? (
          <ExcelExportButton onClick={onExport} exporting={exporting} disabled={exportDisabled} />
        ) : null}
      </div>
      {subtitle ? <ClickHintBox>{subtitle}</ClickHintBox> : null}
    </div>
  )
}

function countColumnLabel(selectedYear: number | null | undefined, t: (key: string, options?: Record<string, string>) => string, locale: string) {
  if (selectedYear == null) return t('pilgrimReports.colPilgrimCount')
  return t('pilgrimReports.colCountForYear', { year: formatNumber(selectedYear, locale) })
}

function TableHeadCell({
  children,
  hint,
}: {
  children: ReactNode
  hint?: string
}) {
  return (
    <th className="px-4 py-3 text-start font-medium">
      <span className="block">{children}</span>
      {hint ? <span className="mt-0.5 block text-[11px] font-normal text-ink-400">{hint}</span> : null}
    </th>
  )
}

function ReportTableCard({
  title,
  subtitle,
  nameColumn,
  rows,
  total,
  locale,
  selectedYear = null,
  loading = false,
  error = false,
  onExport,
  exporting = false,
  onRowClick,
  showYoy = false,
}: {
  title: string
  subtitle?: string
  nameColumn?: string
  rows: {
    key: string
    name: string
    value: number
    previousCount?: number | null
    changePercent?: number | null
    changeCount?: number | null
  }[]
  total: number
  locale: string
  selectedYear?: number | null
  loading?: boolean
  error?: boolean
  onExport?: () => void
  exporting?: boolean
  onRowClick?: (row: { key: string; name: string; value: number }) => void
  showYoy?: boolean
}) {
  const { t } = useTranslation()
  const showPrevious = selectedYear != null
  const yoyHint = t('pilgrimReports.colYoY')

  return (
    <section className="space-y-3">
      <SectionTitleRow
        title={title}
        subtitle={subtitle}
        onExport={onExport}
        exporting={exporting}
        exportDisabled={loading || error || rows.length === 0}
      />
      {error ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      ) : (
        <TableCard
          loading={loading}
          empty={t('pilgrimReports.noGeoData')}
          hasRows={!loading && rows.length > 0}
          rowClick={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <TableHeadCell>{nameColumn ?? t('pilgrimReports.colName')}</TableHeadCell>
                  <TableHeadCell>{countColumnLabel(selectedYear, t, locale)}</TableHeadCell>
                  {showPrevious ? (
                    <TableHeadCell>
                      {t('pilgrimReports.colCountForYear', {
                        year: formatNumber(selectedYear - 1, locale),
                      })}
                    </TableHeadCell>
                  ) : null}
                  <TableHeadCell>{t('pilgrimReports.colPercent')}</TableHeadCell>
                  {showYoy ? (
                    <>
                      <TableHeadCell hint={yoyHint}>{t('pilgrimReports.colGrowth')}</TableHeadCell>
                      <TableHeadCell hint={yoyHint}>{t('pilgrimReports.colChangeCount')}</TableHeadCell>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className={`border-t border-line ${
                      onRowClick ? 'cursor-pointer hover:bg-cream-50' : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{formatGroupedNumber(row.value, locale)}</td>
                    {showPrevious ? (
                      <td className="px-4 py-3">
                        {formatGroupedNumber(row.previousCount ?? 0, locale)}
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      {t('pilgrimReports.percent', {
                        value: formatNumber(percentOf(row.value, total), locale),
                      })}
                    </td>
                    {showYoy ? (
                      <>
                        <td className="px-4 py-3">
                          <YoYBadge changePercent={row.changePercent} locale={locale} />
                        </td>
                        <td className="px-4 py-3">
                          <ChangeCountBadge changeCount={row.changeCount} locale={locale} />
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}
    </section>
  )
}

function YearReportTableCard({
  title,
  rows,
  locale,
  loading = false,
  error = false,
  onExport,
  exporting = false,
}: {
  title: string
  rows: {
    key: string
    name: string
    value: number
    changePercent: number | null
    changeCount: number | null
  }[]
  locale: string
  loading?: boolean
  error?: boolean
  onExport?: () => void
  exporting?: boolean
}) {
  const { t } = useTranslation()
  const yoyHint = t('pilgrimReports.colYoY')

  return (
    <section className="space-y-3">
      <SectionTitleRow
        title={title}
        onExport={onExport}
        exporting={exporting}
        exportDisabled={loading || error || rows.length === 0}
      />
      {error ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      ) : (
        <TableCard
          loading={loading}
          empty={t('pilgrimReports.noGeoData')}
          hasRows={!loading && rows.length > 0}
          rowClick={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <TableHeadCell>{t('pilgrimReports.colYear')}</TableHeadCell>
                  <TableHeadCell>{t('pilgrimReports.colPilgrimCount')}</TableHeadCell>
                  <TableHeadCell hint={yoyHint}>{t('pilgrimReports.colGrowth')}</TableHeadCell>
                  <TableHeadCell hint={yoyHint}>{t('pilgrimReports.colChangeCount')}</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-line">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{formatGroupedNumber(row.value, locale)}</td>
                    <td className="px-4 py-3">
                      <YoYBadge changePercent={row.changePercent} locale={locale} />
                    </td>
                    <td className="px-4 py-3">
                      <ChangeCountBadge changeCount={row.changeCount} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}
    </section>
  )
}

function YoYBadge({
  changePercent,
  locale,
}: {
  changePercent: number | null | undefined
  locale: string
}) {
  const { t } = useTranslation()
  const label = yoyLabel(changePercent, t, locale)

  if (changePercent == null) {
    return <span className="text-ink-400">{label}</span>
  }

  if (changePercent === 0) {
    return <span className="text-ink-500">{label}</span>
  }

  const up = changePercent > 0
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        up ? 'text-teal-700' : 'text-red-700'
      }`}
    >
      {up ? (
        <TrendingUp className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <TrendingDown className="size-3.5 shrink-0" aria-hidden />
      )}
      {label}
    </span>
  )
}

function ChangeCountBadge({
  changeCount,
  locale,
}: {
  changeCount: number | null | undefined
  locale: string
}) {
  const { t } = useTranslation()
  const label = changeCountLabel(changeCount, t, locale)

  if (changeCount == null) {
    return <span className="text-ink-400">{label}</span>
  }

  if (changeCount === 0) {
    return <span className="text-ink-500">{label}</span>
  }

  const up = changeCount > 0
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        up ? 'text-teal-700' : 'text-red-700'
      }`}
    >
      {up ? (
        <TrendingUp className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <TrendingDown className="size-3.5 shrink-0" aria-hidden />
      )}
      {label}
    </span>
  )
}

function YearChangeLegend({
  items,
  locale,
}: {
  items: {
    name: string
    value: number
    changePercent: number | null
    changeCount: number | null
  }[]
  locale: string
}) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <ul className="mt-4 space-y-2 border-t border-line pt-4">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-ink-700">{item.name}</span>
          <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 whitespace-nowrap">
            <span className="font-semibold text-ink-900">
              {formatGroupedNumber(item.value, locale)} {t('pilgrimReports.count')}
            </span>
            <YoYBadge changePercent={item.changePercent} locale={locale} />
            <ChangeCountBadge changeCount={item.changeCount} locale={locale} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function SectionBody({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean
  error: boolean
  empty: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  if (loading) return <LoadingState />
  if (error) return <p className="py-10 text-center text-sm text-red-700">{t('common.error')}</p>
  if (empty) return <EmptyChart />
  return children
}

function ChartCard({
  title,
  subtitle,
  children,
  onExport,
  exporting,
  exportDisabled,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onExport?: () => void
  exporting?: boolean
  exportDisabled?: boolean
}) {
  return (
    <article className={`${cardClassName} p-5`}>
      <div className="mb-4">
        <SectionTitleRow
          title={title}
          subtitle={subtitle}
          onExport={onExport}
          exporting={exporting}
          exportDisabled={exportDisabled}
        />
      </div>
      {children}
    </article>
  )
}

function EmptyChart() {
  const { t } = useTranslation()
  return <p className="py-10 text-center text-sm text-ink-400">{t('pilgrimReports.noGeoData')}</p>
}

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  tone: string
  label: string
  value: string
  hint?: string
}) {
  return (
    <article className={`${cardClassName} flex items-center gap-4 p-5`}>
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-ink-400">{hint}</p> : null}
      </div>
    </article>
  )
}

function ChartLegend({
  items,
  total,
  locale,
}: {
  items: { name: string; value: number; fill: string }[]
  total: number
  locale: string
}) {
  const { t } = useTranslation()
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-ink-700">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
              aria-hidden
            />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap text-ink-900">
            <span className="font-semibold">{formatGroupedNumber(item.value, locale)}</span>
            <span className="text-[11px] text-ink-400">
              {t('pilgrimReports.percent', {
                value: formatNumber(percentOf(item.value, total), locale),
              })}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function DonutChart({
  data,
  total,
  locale,
}: {
  data: { key: string; name: string; value: number; fill: string }[]
  total: number
  locale: string
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className="relative h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={84}
              paddingAngle={3}
              cornerRadius={6}
              stroke="#ffffff"
              strokeWidth={3}
              labelLine={false}
            >
              {data.map((item) => (
                <Cell key={item.key} fill={item.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                offset={10}
                style={chartValueLabel}
                formatter={(value) => chartValueText(value, locale)}
              />
            </Pie>
            <Tooltip content={<ReportTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink-900">{formatGroupedNumber(total, locale)}</span>
          <span className="text-[11px] text-ink-400">{t('pilgrimReports.total')}</span>
        </div>
      </div>
      <ChartLegend items={data} total={total} locale={locale} />
    </>
  )
}

function growthShortLabel(changePercent: number | null | undefined, locale: string) {
  if (changePercent == null) return ''
  const value = formatNumber(Math.abs(changePercent), locale)
  if (changePercent > 0) return `+${value}٪`
  if (changePercent < 0) return `−${value}٪`
  return `${value}٪`
}

function changeCountShortLabel(changeCount: number | null | undefined, locale: string) {
  if (changeCount == null) return ''
  const value = formatGroupedNumber(Math.abs(changeCount), locale)
  if (changeCount > 0) return `+${value}`
  if (changeCount < 0) return `−${value}`
  return value
}

function YearBarLabel({
  x,
  y,
  width,
  value,
  index,
  data,
  locale,
}: {
  x?: number
  y?: number
  width?: number
  value?: number
  index?: number
  data: { value: number; changePercent?: number | null; changeCount?: number | null }[]
  locale: string
}) {
  if (x == null || y == null || width == null || index == null) return null
  const n = Number(value ?? 0)
  if (n <= 0) return null
  const row = data[index]
  const growth = row?.changePercent
  const delta = row?.changeCount
  const cx = x + width / 2
  const growthText = growthShortLabel(growth, locale)
  const deltaText = changeCountShortLabel(delta, locale)
  const detailText = [growthText, deltaText].filter(Boolean).join(' · ')
  const tone =
    (delta != null && delta !== 0 ? delta : growth) ?? 0
  return (
    <g>
      <text
        x={cx}
        y={y - (detailText ? 22 : 8)}
        textAnchor="middle"
        fill="#3f3a34"
        fontSize={12}
        fontWeight={600}
      >
        {formatGroupedNumber(n, locale)}
      </text>
      {detailText ? (
        <text
          x={cx}
          y={y - 8}
          textAnchor="middle"
          fill={tone > 0 ? '#0f766e' : tone < 0 ? '#b91c1c' : '#7a756c'}
          fontSize={11}
          fontWeight={600}
        >
          {detailText}
        </text>
      ) : null}
    </g>
  )
}

function VerticalBarChart({
  data,
  locale,
  height = 280,
  showGrowth = false,
  onItemClick,
}: {
  data: {
    key?: string
    name: string
    value: number
    fill: string
    changePercent?: number | null
    changeCount?: number | null
  }[]
  locale: string
  height?: number
  showGrowth?: boolean
  onItemClick?: (item: { key: string; name: string }) => void
}) {
  const { t } = useTranslation()
  const chartWidth = Math.max(360, data.length * (showGrowth ? 84 : 56))

  return (
    <div className="overflow-x-auto" dir="ltr">
      <div style={{ width: chartWidth, height }} className="min-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: showGrowth ? 44 : 28, right: 8, left: 0, bottom: 48 }}
            barCategoryGap="28%"
          >
            <CartesianGrid stroke="#eceae3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 70 : 40}
            />
            <YAxis
              allowDecimals={false}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(value: number) => formatGroupedNumber(value, locale)}
            />
            <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
            <Bar
              dataKey="value"
              name={t('pilgrimReports.count')}
              radius={[10, 10, 0, 0]}
              maxBarSize={42}
              cursor={onItemClick ? 'pointer' : undefined}
              onClick={(item) => {
                if (!onItemClick) return
                const source =
                  item && typeof item === 'object' && 'payload' in item
                    ? (item as { payload?: { key?: string; name?: string } }).payload
                    : item
                const key = typeof source?.key === 'string' ? source.key : undefined
                const name = typeof source?.name === 'string' ? source.name : undefined
                if (key && name) onItemClick({ key, name })
              }}
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
              {showGrowth ? (
                <LabelList
                  dataKey="value"
                  content={(props) => (
                    <YearBarLabel
                      x={typeof props.x === 'number' ? props.x : undefined}
                      y={typeof props.y === 'number' ? props.y : undefined}
                      width={typeof props.width === 'number' ? props.width : undefined}
                      value={typeof props.value === 'number' ? props.value : Number(props.value ?? 0)}
                      index={props.index}
                      data={data}
                      locale={locale}
                    />
                  )}
                />
              ) : (
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={6}
                  style={chartValueLabel}
                  formatter={(value) => chartValueText(value, locale)}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ReportTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: {
    name?: string
    value?: number
    color?: string
    payload?: { changePercent?: number | null; changeCount?: number | null }
  }[]
  label?: string | number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-2xl border border-line bg-white px-3 py-2.5 text-sm shadow-[0_10px_30px_rgba(20,40,40,0.08)]"
      dir="rtl"
    >
      {label ? <p className="mb-1.5 font-medium text-ink-900">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.name} className="space-y-0.5">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-ink-700">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                {item.name}
              </span>
              <span className="font-semibold text-ink-900">
                {formatGroupedNumber(Number(item.value ?? 0), locale)} {t('pilgrimReports.count')}
              </span>
            </div>
            {item.payload && 'changePercent' in item.payload ? (
              <div className="space-y-0.5 ps-4 text-[11px]">
                <YoYBadge changePercent={item.payload.changePercent} locale={locale} />
                <ChangeCountBadge changeCount={item.payload.changeCount} locale={locale} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlaceYearGrowthModal({
  kind,
  placeId,
  placeName,
  locale,
  exporting,
  onExport,
  onClose,
}: {
  kind: PlaceKind
  placeId: string
  placeName: string
  locale: string
  exporting: boolean
  onExport: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['pilgrims', 'report', `${kind}-timeline`, placeId],
    queryFn: async () => {
      if (kind === 'province') {
        const { data } = await api.get<PilgrimReportProvinceTimeline>(
          '/pilgrims/report/province-timeline',
          { params: { provinceId: placeId } },
        )
        return { byYear: data.byYear }
      }
      const { data } = await api.get<PilgrimReportCityTimeline>('/pilgrims/report/city-timeline', {
        params: { cityId: placeId },
      })
      return { byYear: data.byYear }
    },
  })

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const rows = (query.data?.byYear ?? []).map((row) => ({
    key: String(row.year),
    name: formatNumber(row.year, locale),
    value: row.count,
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))
  const bars = rows.map((row) => ({
    name: row.name,
    value: row.value,
    fill: '#2ebdb6',
    changePercent: row.changePercent,
    changeCount: row.changeCount,
  }))
  const titleKey =
    kind === 'province' ? 'pilgrimReports.provinceYearTitle' : 'pilgrimReports.cityYearTitle'
  const subtitleKey =
    kind === 'province' ? 'pilgrimReports.provinceYearSubtitle' : 'pilgrimReports.cityYearSubtitle'
  const emptyKey =
    kind === 'province' ? 'pilgrimReports.provinceYearEmpty' : 'pilgrimReports.cityYearEmpty'

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        className="fixed inset-0 bg-ink-900/30"
        aria-label={t('pilgrimReports.closeModal')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-year-growth-title"
        className={`relative z-10 mb-4 flex w-full max-w-3xl flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5 sm:p-6">
          <div className="min-w-0 space-y-1">
            <h2
              id="place-year-growth-title"
              className="text-lg font-semibold text-ink-900"
            >
              {t(titleKey, { name: placeName })}
            </h2>
            <p className="text-sm text-ink-500">{t(subtitleKey)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ExcelExportButton
              onClick={onExport}
              exporting={exporting}
              disabled={query.isLoading || query.isError || rows.length === 0}
            />
            <Button type="button" variant="ghost" icon onClick={onClose}>
              <X className="size-4" aria-hidden />
              <span className="sr-only">{t('pilgrimReports.closeModal')}</span>
            </Button>
          </div>
        </div>
        <div className="min-h-0 p-5 sm:p-6">
          {query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-red-700">{t('common.error')}</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">{t(emptyKey)}</p>
          ) : (
            <div className="space-y-6">
              <VerticalBarChart data={bars} locale={locale} showGrowth />
              <YearReportTableCard title={t('pilgrimReports.byYear')} rows={rows} locale={locale} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
