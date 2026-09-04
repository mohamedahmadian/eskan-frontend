import {
  Banknote,
  CalendarDays,
  CircleCheck,
  HandCoins,
  HandHeart,
  Megaphone,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { languageDir } from '../../i18n'
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
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import {
  currentPersianYear,
  formatGroupedNumber,
  formatNumber,
  persianYearOptions,
} from '../../lib/datetime'
import type { CampaignReport } from '../../types/app'

const ALL_YEARS = 'all'
const seriesPalette = ['#148f8a', '#2ebdb6', '#5ed4ce', '#e8b83a', '#f5cd6a', '#7a756c']
const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }
const amountColors = { target: '#e8b83a', collected: '#2ebdb6' }

function chartValueText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatNumber(n, locale) : ''
}

function chartMoneyText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatGroupedNumber(n, locale) : ''
}

function percentOf(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function parseYearParam(raw: string | null, fallback: number): number | null {
  if (raw === ALL_YEARS) return null
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

function barChartHeight(count: number, row = 36, min = 280) {
  return Math.max(min, count * row + 48)
}

function paletteColor(index: number) {
  return seriesPalette[index % seriesPalette.length] ?? seriesPalette[0]
}

export function CampaignsReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYearParam(yearFromUrl, currentYear)
  const yearSelectValue = year == null ? ALL_YEARS : String(year)

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: ALL_YEARS })
  }, [setParams, yearFromUrl])

  const query = useQuery({
    queryKey: ['participation-campaigns', 'report', year],
    queryFn: async () => {
      const { data } = await api.get<CampaignReport>('/participation-campaigns/report', {
        params: year == null ? {} : { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const totalCount = report?.totalCount ?? 0

  const yearOptions = [
    { value: ALL_YEARS, label: t('campaignReports.allYears') },
    ...persianYearOptions(locale, year ?? currentYear),
  ]

  const activeData = [
    { key: 'active', name: t('campaignReports.active'), value: report?.activeCount ?? 0, fill: '#2ebdb6' },
    { key: 'inactive', name: t('campaignReports.inactive'), value: report?.inactiveCount ?? 0, fill: '#e8b83a' },
  ]
  const progressData = [
    { key: 'empty', name: t('campaignReports.progressEmpty'), value: report?.emptyCount ?? 0, fill: '#7a756c' },
    {
      key: 'inProgress',
      name: t('campaignReports.progressInProgress'),
      value: report?.inProgressCount ?? 0,
      fill: '#e8b83a',
    },
    {
      key: 'completed',
      name: t('campaignReports.progressCompleted'),
      value: report?.completedCount ?? 0,
      fill: '#2ebdb6',
    },
  ]
  const lifecycleData = [
    { key: 'upcoming', name: t('campaignReports.upcoming'), value: report?.upcomingCount ?? 0, fill: '#e8b83a' },
    { key: 'running', name: t('campaignReports.running'), value: report?.runningCount ?? 0, fill: '#2ebdb6' },
    { key: 'ended', name: t('campaignReports.ended'), value: report?.endedCount ?? 0, fill: '#7a756c' },
  ]
  const paymentData = [
    { key: 'bank', name: t('campaignReports.paymentBank'), value: report?.byPayment?.find((row) => row.key === 'bank')?.count ?? 0, fill: '#2ebdb6' },
    { key: 'crypto', name: t('campaignReports.paymentCrypto'), value: report?.byPayment?.find((row) => row.key === 'crypto')?.count ?? 0, fill: '#e8b83a' },
    { key: 'both', name: t('campaignReports.paymentBoth'), value: report?.byPayment?.find((row) => row.key === 'both')?.count ?? 0, fill: '#5ed4ce' },
  ]

  const timeRows = year == null ? (report?.byYear ?? []) : (report?.byMonth ?? [])
  const timeBarData = timeRows.map((row) => ({
    name:
      year == null
        ? formatNumber(row.year ?? 0, locale)
        : t(`contributionReports.months.${row.month}`),
    target: row.targetAmount,
    collected: row.collectedAmount,
    count: row.count,
  }))

  const amountBarData = (report?.topByAmount ?? [])
    .filter((row) => row.amount > 0)
    .map((row, index) => ({
      name: row.name,
      value: row.amount,
      fill: paletteColor(index),
    }))
  const participantBarData = (report?.topByParticipants ?? [])
    .filter((row) => row.count > 0)
    .map((row, index) => ({
      name: row.name,
      value: row.count,
      fill: paletteColor(index),
    }))
  const progressBarData = (report?.topByProgress ?? [])
    .filter((row) => row.progressPercent > 0)
    .map((row, index) => ({
      name: row.name,
      value: row.progressPercent,
      fill: paletteColor(index),
    }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.campaignsReport')}
        subtitle={t('campaignReports.subtitle')}
      />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('campaignReports.year')} htmlFor="campaign-report-year">
            <SearchSelect
              id="campaign-report-year"
              value={yearSelectValue}
              placeholder={t('campaignReports.selectYear')}
              onChange={(next) => setParams({ year: next || ALL_YEARS })}
              options={yearOptions}
            />
          </FormField>
        </div>
      </article>

      {query.isLoading && !report ? (
        <LoadingState />
      ) : query.isError || !report ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      ) : (
        <div className={`space-y-6 ${query.isFetching ? 'opacity-70' : ''}`}>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Megaphone}
              tone="bg-teal-50 text-teal-700"
              label={t('campaignReports.totalCount')}
              value={formatNumber(totalCount, locale)}
            />
            <KpiCard
              icon={CircleCheck}
              tone="bg-mint-50 text-mint-600"
              label={t('campaignReports.activeCount')}
              value={formatNumber(report.activeCount, locale)}
            />
            <KpiCard
              icon={Banknote}
              tone="bg-teal-50 text-teal-700"
              label={t('campaignReports.targetAmount')}
              value={formatGroupedNumber(report.targetAmount, locale)}
              hint={t('participations.toman')}
            />
            <KpiCard
              icon={Banknote}
              tone="bg-mint-50 text-mint-600"
              label={t('campaignReports.collectedAmount')}
              value={formatGroupedNumber(report.collectedAmount, locale)}
              hint={t('participations.toman')}
            />
            <KpiCard
              icon={HandCoins}
              tone="bg-teal-50 text-teal-700"
              label={t('campaignReports.purchasedShares')}
              value={formatNumber(report.purchasedShares, locale)}
              hint={t('campaignReports.countHint', {
                value: formatNumber(report.totalShares, locale),
              })}
            />
            <KpiCard
              icon={HandHeart}
              tone="bg-mint-50 text-mint-600"
              label={t('campaignReports.participantCount')}
              value={formatNumber(report.participantCount, locale)}
            />
            <KpiCard
              icon={HandHeart}
              tone="bg-teal-50 text-teal-700"
              label={t('campaignReports.benefactorCount')}
              value={formatNumber(report.benefactorCount, locale)}
            />
            <KpiCard
              icon={Trophy}
              tone="bg-mint-50 text-mint-600"
              label={t('campaignReports.avgProgress')}
              value={`${formatNumber(report.avgProgress, locale)}٪`}
              hint={t('campaignReports.countHint', {
                value: formatNumber(report.completedCount, locale),
              })}
            />
          </section>

          {totalCount === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('campaignReports.empty')}
            </p>
          ) : (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                <DonutCard
                  title={t('campaignReports.byActive')}
                  data={activeData}
                  total={totalCount}
                  locale={locale}
                  centerLabel={t('campaignReports.count')}
                />
                <DonutCard
                  title={t('campaignReports.byProgress')}
                  data={progressData}
                  total={totalCount}
                  locale={locale}
                  centerLabel={t('campaignReports.count')}
                />
                <DonutCard
                  title={t('campaignReports.byLifecycle')}
                  data={lifecycleData}
                  total={totalCount}
                  locale={locale}
                  centerLabel={t('campaignReports.count')}
                />
                <DonutCard
                  title={t('campaignReports.byPayment')}
                  data={paymentData}
                  total={totalCount}
                  locale={locale}
                  centerLabel={t('campaignReports.count')}
                />
              </section>

              <article className={`${cardClassName} p-5`}>
                <h2 className="mb-4 text-sm font-medium text-ink-500">
                  {year == null ? t('campaignReports.byYear') : t('campaignReports.byMonth')}
                </h2>
                <div className="h-80" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeBarData}
                      margin={{ top: 28, right: 8, left: 0, bottom: 8 }}
                      barCategoryGap="28%"
                      barGap={6}
                    >
                      <CartesianGrid stroke="#eceae3" vertical={false} />
                      <XAxis dataKey="name" tick={chartAxisTick} axisLine={false} tickLine={false} />
                      <YAxis
                        allowDecimals={false}
                        tick={chartAxisTick}
                        axisLine={false}
                        tickLine={false}
                        width={56}
                        tickFormatter={(value: number) => formatGroupedNumber(value, locale)}
                      />
                      <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip money />} />
                      <Bar
                        dataKey="target"
                        name={t('campaignReports.targetAmount')}
                        fill={amountColors.target}
                        radius={[10, 10, 0, 0]}
                        maxBarSize={36}
                      >
                        <LabelList
                          dataKey="target"
                          position="top"
                          offset={6}
                          style={chartValueLabel}
                          formatter={(value) => chartMoneyText(value, locale)}
                        />
                      </Bar>
                      <Bar
                        dataKey="collected"
                        name={t('campaignReports.collectedAmount')}
                        fill={amountColors.collected}
                        radius={[10, 10, 0, 0]}
                        maxBarSize={36}
                      >
                        <LabelList
                          dataKey="collected"
                          position="top"
                          offset={6}
                          style={chartValueLabel}
                          formatter={(value) => chartMoneyText(value, locale)}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <section className="grid gap-4 lg:grid-cols-2">
                <HorizontalBarCard
                  title={t('campaignReports.topByAmount')}
                  data={amountBarData}
                  locale={locale}
                  empty={t('campaignReports.emptyTop')}
                  money
                />
                <HorizontalBarCard
                  title={t('campaignReports.topByParticipants')}
                  data={participantBarData}
                  locale={locale}
                  empty={t('campaignReports.emptyTop')}
                />
              </section>

              <HorizontalBarCard
                title={t('campaignReports.topByProgress')}
                data={progressBarData}
                locale={locale}
                empty={t('campaignReports.emptyTop')}
                percent
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function HorizontalBarCard({
  title,
  data,
  locale,
  empty,
  money,
  percent,
}: {
  title: string
  data: { name: string; value: number; fill: string }[]
  locale: string
  empty: string
  money?: boolean
  percent?: boolean
}) {
  const { t } = useTranslation()
  if (!data.length) {
    return (
      <article className={`${cardClassName} p-5`}>
        <h2 className="mb-2 text-sm font-medium text-ink-500">{title}</h2>
        <p className="text-sm text-ink-400">{empty}</p>
      </article>
    )
  }
  const formatLabel = (value: unknown) => {
    const n = Number(value ?? 0)
    if (n <= 0) return ''
    if (percent) return `${formatNumber(n, locale)}٪`
    if (money) return formatGroupedNumber(n, locale)
    return formatNumber(n, locale)
  }
  return (
    <article className={`${cardClassName} p-5`}>
      <h2 className="mb-4 text-sm font-medium text-ink-500">{title}</h2>
      <div
        className="w-full"
        style={{ height: barChartHeight(data.length, 38, 240) }}
        dir="ltr"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
            barCategoryGap="18%"
          >
            <CartesianGrid stroke="#eceae3" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                percent ? `${formatNumber(value, locale)}٪` : money ? formatGroupedNumber(value, locale) : formatNumber(value, locale)
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#eefaf9' }}
              content={<ReportTooltip money={money} percent={percent} />}
            />
            <Bar dataKey="value" name={t('campaignReports.amount')} radius={[0, 10, 10, 0]} maxBarSize={26}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={6}
                style={chartValueLabel}
                formatter={formatLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

function DonutCard({
  title,
  data,
  total,
  locale,
  centerLabel,
}: {
  title: string
  data: { key?: string; name: string; value: number; fill: string }[]
  total: number
  locale: string
  centerLabel: string
}) {
  return (
    <article className={`${cardClassName} p-5`}>
      <h2 className="mb-4 text-sm font-medium text-ink-500">{title}</h2>
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
                <Cell key={item.key ?? item.name} fill={item.fill} />
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
          <span className="text-[11px] text-ink-400">{centerLabel}</span>
        </div>
      </div>
      <ChartLegend items={data} total={total} locale={locale} />
    </article>
  )
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
        <p className="mt-1 truncate text-2xl font-semibold text-ink-900">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-[11px] text-ink-400">{hint}</p> : null}
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
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} aria-hidden />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap text-ink-900">
            <span className="font-semibold">{formatNumber(item.value, locale)}</span>
            <span className="text-[11px] text-ink-400">
              {t('campaignReports.percent', {
                value: formatNumber(percentOf(item.value, total), locale),
              })}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function ReportTooltip({
  active,
  payload,
  label,
  money,
  percent,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string | number
  money?: boolean
  percent?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!active || !payload?.length) return null
  const format = money ? formatGroupedNumber : formatNumber
  const unit = percent ? '٪' : money ? t('participations.toman') : t('campaignReports.count')

  return (
    <div
      className="rounded-2xl border border-line bg-white px-3 py-2.5 text-sm shadow-[0_10px_30px_rgba(20,40,40,0.08)]"
      dir={languageDir(locale)}
    >
      {label ? <p className="mb-1.5 font-medium text-ink-900">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-ink-700">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
              {item.name}
            </span>
            <span className="font-semibold text-ink-900">
              {format(Number(item.value ?? 0), locale)} {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
