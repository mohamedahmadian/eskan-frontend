import {
  CalendarDays,
  Mars,
  TrendingDown,
  TrendingUp,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  cardClassName,
  FormField,
  listShellClassName,
  LoadingState,
  PageHeader,
} from '../../components/ui/Form'
import { TableCard } from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import type {
  PilgrimReportGeo,
  PilgrimReportReligion,
  PilgrimReportSummary,
  PilgrimReportTimeline,
} from '../../types/app'

const reportViews = ['charts', 'table'] as const
type ReportView = (typeof reportViews)[number]

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
  return n > 0 ? formatNumber(n, locale) : ''
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

  const religionQuery = useQuery({
    queryKey: ['pilgrims', 'report', 'religion', year],
    queryFn: async () => {
      const { data } = await api.get<PilgrimReportReligion>('/pilgrims/report/religion', {
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

  const summary = summaryQuery.data
  const total = summary?.total ?? 0
  const male = summary?.byGender.male ?? 0
  const female = summary?.byGender.female ?? 0
  const unspecified = summary?.byGender.unspecified ?? 0
  const active = summary?.byStatus.active ?? 0
  const inactive = summary?.byStatus.inactive ?? 0

  const yearOptions = [
    { value: ALL_YEARS, label: t('pilgrimReports.allYears') },
    ...persianYearOptions(locale, year ?? currentYear),
  ]

  const statusRows = [
    { key: 'active', name: t('geo.active'), value: active },
    { key: 'inactive', name: t('geo.inactive'), value: inactive },
  ].filter((item) => item.value > 0)

  const statusPieData = statusRows.map((item) => ({
    ...item,
    fill: item.key === 'active' ? '#2ebdb6' : '#e8b83a',
  }))

  const religionRows = (religionQuery.data?.byReligion ?? []).map((row) => ({
    key: row.religion,
    name: t(`religions.${row.religion}`),
    value: row.count,
  }))

  const religionPieData = religionRows.map((row, index) => ({
    ...row,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const countryRows = (geoQuery.data?.byCountry ?? []).map((row) => ({
    key: row.id,
    name: geoDisplayName(row.id, row.name, t),
    value: row.count,
  }))

  const countryPieData = countryRows.map((row, index) => ({
    ...row,
    fill: row.key === UNSPECIFIED_GEO_ID ? UNSPECIFIED_GEO_COLOR : CHART_COLORS[index % CHART_COLORS.length],
  }))

  const provinceRows = (geoQuery.data?.byProvince ?? []).map((row) => ({
    key: row.id,
    name: geoDisplayName(row.id, row.name, t),
    value: row.count,
  }))

  const provinceBars = provinceRows.map((row, index) => ({
    name: row.name,
    value: row.value,
    fill: row.key === UNSPECIFIED_GEO_ID ? UNSPECIFIED_GEO_COLOR : CHART_COLORS[index % CHART_COLORS.length],
  }))

  const cityRows = (geoQuery.data?.byCity ?? []).map((row) => ({
    key: row.id,
    name: geoDisplayName(row.id, row.name, t),
    value: row.count,
  }))

  const cityBars = cityRows.map((row, index) => ({
    name: row.name,
    value: row.value,
    fill: row.key === UNSPECIFIED_GEO_ID ? UNSPECIFIED_GEO_COLOR : CHART_COLORS[index % CHART_COLORS.length],
  }))

  const yearRows = (timelineQuery.data?.byYear ?? []).map((row) => ({
    key: String(row.year),
    name: formatNumber(row.year, locale),
    value: row.count,
    changePercent: row.changePercent,
  }))

  const monthRows = (timelineQuery.data?.byMonth ?? []).map((row) => ({
    key: String(row.month),
    name: t('pilgrimReports.month', { value: formatNumber(row.month, locale) }),
    value: row.count,
  }))

  const yearBars = yearRows.map((row) => ({
    name: row.name,
    value: row.value,
    fill: '#2ebdb6',
    changePercent: row.changePercent,
  }))

  const monthBars = monthRows.map((row) => ({
    name: row.name,
    value: row.value,
    fill: '#148f8a',
  }))

  const yearTotal = yearRows.reduce((sum, row) => sum + row.value, 0)
  const showMonthBreakdown = year != null

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
              value={formatNumber(total, locale)}
            />
            {genderKpis.map((item) => (
              <KpiCard
                key={item.key}
                icon={item.icon}
                tone={item.tone}
                label={item.label}
                value={formatNumber(item.value, locale)}
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
                  <section className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title={t('pilgrimReports.byStatus')}>
                      <DonutChart data={statusPieData} total={total} locale={locale} />
                    </ChartCard>
                    <ChartCard title={t('pilgrimReports.byCountry')}>
                      <SectionBody
                        loading={geoQuery.isLoading && !geoQuery.data}
                        error={geoQuery.isError}
                        empty={chartsReady && countryPieData.length === 0}
                      >
                        <DonutChart data={countryPieData} total={total} locale={locale} />
                      </SectionBody>
                    </ChartCard>
                  </section>

                  <section className={`grid gap-4 ${showMonthBreakdown ? 'lg:grid-cols-2' : ''}`}>
                    {showMonthBreakdown ? (
                      <ChartCard title={t('pilgrimReports.byMonth')}>
                        <SectionBody
                          loading={timelineQuery.isLoading && !timelineQuery.data}
                          error={timelineQuery.isError}
                          empty={chartsReady && monthBars.length === 0}
                        >
                          <VerticalBarChart data={monthBars} locale={locale} />
                        </SectionBody>
                      </ChartCard>
                    ) : null}
                    <ChartCard title={t('pilgrimReports.byYear')}>
                      <SectionBody
                        loading={timelineQuery.isLoading && !timelineQuery.data}
                        error={timelineQuery.isError}
                        empty={chartsReady && yearBars.length === 0}
                      >
                        <VerticalBarChart data={yearBars} locale={locale} />
                        <YearChangeLegend items={yearBars} locale={locale} />
                      </SectionBody>
                    </ChartCard>
                  </section>

                  <ChartCard title={t('pilgrimReports.byProvince')}>
                    <SectionBody
                      loading={geoQuery.isLoading && !geoQuery.data}
                      error={geoQuery.isError}
                      empty={chartsReady && provinceBars.length === 0}
                    >
                      <VerticalBarChart
                        data={provinceBars}
                        locale={locale}
                        height={Math.max(280, provinceBars.length * 28)}
                      />
                    </SectionBody>
                  </ChartCard>

                  <ChartCard title={t('pilgrimReports.byCity')}>
                    <SectionBody
                      loading={geoQuery.isLoading && !geoQuery.data}
                      error={geoQuery.isError}
                      empty={chartsReady && cityBars.length === 0}
                    >
                      <VerticalBarChart
                        data={cityBars}
                        locale={locale}
                        height={Math.max(280, cityBars.length * 28)}
                      />
                    </SectionBody>
                  </ChartCard>

                  <ChartCard title={t('pilgrimReports.byReligion')}>
                    <SectionBody
                      loading={religionQuery.isLoading && !religionQuery.data}
                      error={religionQuery.isError}
                      empty={chartsReady && religionPieData.length === 0}
                    >
                      <DonutChart data={religionPieData} total={total} locale={locale} />
                    </SectionBody>
                  </ChartCard>
                </div>
              ) : (
                <div className="space-y-6">
                  <ReportTableCard
                    title={t('pilgrimReports.byStatus')}
                    rows={statusRows}
                    total={total}
                    locale={locale}
                  />
                  <ReportTableCard
                    title={t('pilgrimReports.byCountry')}
                    rows={countryRows}
                    total={total}
                    locale={locale}
                    loading={geoQuery.isLoading && !geoQuery.data}
                    error={geoQuery.isError}
                  />
                  {showMonthBreakdown ? (
                    <ReportTableCard
                      title={t('pilgrimReports.byMonth')}
                      rows={monthRows}
                      total={total}
                      locale={locale}
                      loading={timelineQuery.isLoading && !timelineQuery.data}
                      error={timelineQuery.isError}
                    />
                  ) : null}
                  <YearReportTableCard
                    title={t('pilgrimReports.byYear')}
                    rows={yearRows}
                    total={yearTotal}
                    locale={locale}
                    loading={timelineQuery.isLoading && !timelineQuery.data}
                    error={timelineQuery.isError}
                  />
                  <ReportTableCard
                    title={t('pilgrimReports.byProvince')}
                    rows={provinceRows}
                    total={total}
                    locale={locale}
                    loading={geoQuery.isLoading && !geoQuery.data}
                    error={geoQuery.isError}
                  />
                  <ReportTableCard
                    title={t('pilgrimReports.byCity')}
                    rows={cityRows}
                    total={total}
                    locale={locale}
                    loading={geoQuery.isLoading && !geoQuery.data}
                    error={geoQuery.isError}
                  />
                  <ReportTableCard
                    title={t('pilgrimReports.byReligion')}
                    rows={religionRows}
                    total={total}
                    locale={locale}
                    loading={religionQuery.isLoading && !religionQuery.data}
                    error={religionQuery.isError}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
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

function ReportTableCard({
  title,
  rows,
  total,
  locale,
  loading = false,
  error = false,
}: {
  title: string
  rows: { key: string; name: string; value: number }[]
  total: number
  locale: string
  loading?: boolean
  error?: boolean
}) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-ink-500">{title}</h2>
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
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colName')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colCount')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colPercent')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-line">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{formatNumber(row.value, locale)}</td>
                    <td className="px-4 py-3">
                      {t('pilgrimReports.percent', {
                        value: formatNumber(percentOf(row.value, total), locale),
                      })}
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

function YearReportTableCard({
  title,
  rows,
  total,
  locale,
  loading = false,
  error = false,
}: {
  title: string
  rows: { key: string; name: string; value: number; changePercent: number | null }[]
  total: number
  locale: string
  loading?: boolean
  error?: boolean
}) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-ink-500">{title}</h2>
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
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colName')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colCount')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colPercent')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('pilgrimReports.colYoY')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-line">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{formatNumber(row.value, locale)}</td>
                    <td className="px-4 py-3">
                      {t('pilgrimReports.percent', {
                        value: formatNumber(percentOf(row.value, total), locale),
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <YoYBadge changePercent={row.changePercent} locale={locale} />
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

function YearChangeLegend({
  items,
  locale,
}: {
  items: { name: string; value: number; changePercent: number | null }[]
  locale: string
}) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <ul className="mt-4 space-y-2 border-t border-line pt-4">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-ink-700">{item.name}</span>
          <span className="flex items-center gap-3 whitespace-nowrap">
            <span className="font-semibold text-ink-900">
              {formatNumber(item.value, locale)} {t('pilgrimReports.count')}
            </span>
            <YoYBadge changePercent={item.changePercent} locale={locale} />
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

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={`${cardClassName} p-5`}>
      <h2 className="mb-4 text-sm font-medium text-ink-500">{title}</h2>
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
            <span className="font-semibold">{formatNumber(item.value, locale)}</span>
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
          <span className="text-2xl font-semibold text-ink-900">{formatNumber(total, locale)}</span>
          <span className="text-[11px] text-ink-400">{t('pilgrimReports.total')}</span>
        </div>
      </div>
      <ChartLegend items={data} total={total} locale={locale} />
    </>
  )
}

function VerticalBarChart({
  data,
  locale,
  height = 280,
}: {
  data: { name: string; value: number; fill: string; changePercent?: number | null }[]
  locale: string
  height?: number
}) {
  const { t } = useTranslation()
  const chartWidth = Math.max(360, data.length * 56)

  return (
    <div className="overflow-x-auto" dir="ltr">
      <div style={{ width: chartWidth, height }} className="min-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 28, right: 8, left: 0, bottom: 48 }} barCategoryGap="28%">
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
              tickFormatter={(value: number) => formatNumber(value, locale)}
            />
            <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
            <Bar dataKey="value" name={t('pilgrimReports.count')} radius={[10, 10, 0, 0]} maxBarSize={42}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                offset={6}
                style={chartValueLabel}
                formatter={(value) => chartValueText(value, locale)}
              />
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
    payload?: { changePercent?: number | null }
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
                {formatNumber(Number(item.value ?? 0), locale)} {t('pilgrimReports.count')}
              </span>
            </div>
            {item.payload && 'changePercent' in item.payload ? (
              <p className="ps-4 text-[11px]">
                <YoYBadge changePercent={item.payload.changePercent} locale={locale} />
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
