import {
  Banknote,
  CalendarDays,
  HandCoins,
  HandHeart,
  Megaphone,
  Package,
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
  ToggleField,
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
import type { ContributionReport } from '../../types/app'

const ALL_YEARS = 'all'
const seriesPalette = ['#148f8a', '#2ebdb6', '#5ed4ce', '#e8b83a', '#f5cd6a', '#7a756c']
const typeColors = { CASH: '#2ebdb6', IN_KIND: '#e8b83a' }
const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

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

export function ContributionsReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYearParam(yearFromUrl, currentYear)
  const yearSelectValue = year == null ? ALL_YEARS : String(year)
  const excludeCampaigns = searchParams.get('excludeCampaigns') === '1'

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: ALL_YEARS })
  }, [setParams, yearFromUrl])

  const query = useQuery({
    queryKey: ['contributions', 'report', year, excludeCampaigns],
    queryFn: async () => {
      const { data } = await api.get<ContributionReport>('/contributions/report', {
        params: {
          ...(year == null ? {} : { year }),
          ...(excludeCampaigns ? { excludeCampaigns: true } : {}),
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const totalCount = report?.totalCount ?? 0
  const totalAmount = report?.totalAmount ?? 0
  const topGood = report?.topGoods[0]
  const topBenefactor = report?.topBenefactors[0]

  const yearOptions = [
    { value: ALL_YEARS, label: t('contributionReports.allYears') },
    ...persianYearOptions(locale, year ?? currentYear),
  ]

  const typeCountData = [
    {
      key: 'CASH',
      name: t('contributions.types.CASH'),
      value: report?.cashCount ?? 0,
      fill: typeColors.CASH,
    },
    {
      key: 'IN_KIND',
      name: t('contributions.types.IN_KIND'),
      value: report?.inKindCount ?? 0,
      fill: typeColors.IN_KIND,
    },
  ]

  const typeAmountData = [
    {
      key: 'CASH',
      name: t('contributions.types.CASH'),
      value: report?.cashAmount ?? 0,
      fill: typeColors.CASH,
    },
    {
      key: 'IN_KIND',
      name: t('contributions.types.IN_KIND'),
      value: report?.inKindAmount ?? 0,
      fill: typeColors.IN_KIND,
    },
  ]

  const timeRows = year == null ? (report?.byYear ?? []) : (report?.byMonth ?? [])
  const timeBarData = timeRows.map((row) => ({
    name:
      year == null
        ? formatNumber(row.year ?? 0, locale)
        : t(`contributionReports.months.${row.month}`),
    cash: row.cashAmount,
    inKind: row.inKindAmount,
    amount: row.amount,
    count: row.count,
  }))

  const goodsBarData = (report?.topGoods ?? []).map((row, index) => ({
    name: row.name,
    value: row.amount,
    count: row.count,
    fill: paletteColor(index),
  }))

  const benefactorBarData = (report?.topBenefactors ?? []).map((row, index) => ({
    name: row.name,
    value: row.amount,
    count: row.count,
    fill: paletteColor(index),
  }))

  const campaignBarData = (report?.byCampaign ?? []).slice(0, 10).map((row, index) => ({
    name: row.id ? row.name : t('contributionReports.noCampaign'),
    value: row.amount,
    count: row.count,
    fill: paletteColor(index),
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.contributionsReport')}
        subtitle={t('contributionReports.subtitle')}
      />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={CalendarDays} label={t('contributionReports.year')} htmlFor="contribution-report-year">
            <SearchSelect
              id="contribution-report-year"
              value={yearSelectValue}
              placeholder={t('contributionReports.selectYear')}
              onChange={(next) => setParams({ year: next || ALL_YEARS })}
              options={yearOptions}
            />
          </FormField>
          <FormField
            icon={Megaphone}
            label={t('contributionReports.campaignScope')}
            htmlFor="contribution-report-campaigns"
          >
            <ToggleField
              id="contribution-report-campaigns"
              checked={!excludeCampaigns}
              onChange={(checked) => setParams({ excludeCampaigns: checked ? undefined : '1' })}
              onLabel={t('common.all')}
              offLabel={t('contributionReports.withoutCampaigns')}
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
          <section className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={HandCoins}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionReports.totalCount')}
              value={formatNumber(totalCount, locale)}
            />
            <KpiCard
              icon={Banknote}
              tone="bg-mint-50 text-mint-600"
              label={t('contributionReports.totalAmount')}
              value={formatGroupedNumber(totalAmount, locale)}
              hint={t('participations.toman')}
            />
            <KpiCard
              icon={HandHeart}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionReports.benefactorCount')}
              value={formatNumber(report.benefactorCount, locale)}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={Banknote}
              tone="bg-mint-50 text-mint-600"
              label={t('contributionReports.cashAmount')}
              value={formatGroupedNumber(report.cashAmount, locale)}
              hint={t('contributionReports.countHint', {
                value: formatNumber(report.cashCount, locale),
              })}
            />
            <KpiCard
              icon={Package}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionReports.inKindAmount')}
              value={formatGroupedNumber(report.inKindAmount, locale)}
              hint={t('contributionReports.countHint', {
                value: formatNumber(report.inKindCount, locale),
              })}
            />
            <KpiCard
              icon={Megaphone}
              tone="bg-mint-50 text-mint-600"
              label={t('contributionReports.avgAmount')}
              value={formatGroupedNumber(report.avgAmount, locale)}
              hint={t('participations.toman')}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              icon={Trophy}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionReports.topGood')}
              value={topGood?.name ?? '—'}
              hint={
                topGood
                  ? `${formatGroupedNumber(topGood.amount, locale)} ${t('participations.toman')}`
                  : undefined
              }
            />
            <KpiCard
              icon={Trophy}
              tone="bg-mint-50 text-mint-600"
              label={t('contributionReports.topBenefactor')}
              value={topBenefactor?.name ?? '—'}
              hint={
                topBenefactor
                  ? `${formatGroupedNumber(topBenefactor.amount, locale)} ${t('participations.toman')}`
                  : undefined
              }
            />
            <KpiCard
              icon={HandCoins}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionReports.onlineCount')}
              value={formatNumber(report.onlineCount, locale)}
              hint={
                report.onlineAmount
                  ? `${formatGroupedNumber(report.onlineAmount, locale)} ${t('participations.toman')}`
                  : undefined
              }
            />
          </section>

          {totalCount === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('contributionReports.empty')}
            </p>
          ) : (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                <DonutCard
                  title={t('contributionReports.byTypeCount')}
                  data={typeCountData}
                  total={totalCount}
                  locale={locale}
                  centerLabel={t('contributionReports.count')}
                  money={false}
                />
                <DonutCard
                  title={t('contributionReports.byTypeAmount')}
                  data={typeAmountData}
                  total={totalAmount}
                  locale={locale}
                  centerLabel={t('participations.toman')}
                  money
                />
              </section>

              <article className={`${cardClassName} p-5`}>
                <h2 className="mb-4 text-sm font-medium text-ink-500">
                  {year == null
                    ? t('contributionReports.byYear')
                    : t('contributionReports.byMonth')}
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
                        dataKey="cash"
                        name={t('contributions.types.CASH')}
                        fill={typeColors.CASH}
                        radius={[10, 10, 0, 0]}
                        maxBarSize={36}
                      >
                        <LabelList
                          dataKey="cash"
                          position="top"
                          offset={6}
                          style={chartValueLabel}
                          formatter={(value) => chartMoneyText(value, locale)}
                        />
                      </Bar>
                      <Bar
                        dataKey="inKind"
                        name={t('contributions.types.IN_KIND')}
                        fill={typeColors.IN_KIND}
                        radius={[10, 10, 0, 0]}
                        maxBarSize={36}
                      >
                        <LabelList
                          dataKey="inKind"
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
                  title={t('contributionReports.topGoods')}
                  data={goodsBarData}
                  locale={locale}
                  empty={t('contributionReports.emptyGoods')}
                />
                <HorizontalBarCard
                  title={t('contributionReports.topBenefactors')}
                  data={benefactorBarData}
                  locale={locale}
                  empty={t('contributionReports.emptyBenefactors')}
                />
              </section>

              {!excludeCampaigns ? (
                <HorizontalBarCard
                  title={t('contributionReports.byCampaign')}
                  data={campaignBarData}
                  locale={locale}
                  empty={t('contributionReports.emptyCampaigns')}
                />
              ) : null}
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
}: {
  title: string
  data: { name: string; value: number; fill: string }[]
  locale: string
  empty: string
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
              tickFormatter={(value: number) => formatGroupedNumber(value, locale)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip money />} />
            <Bar dataKey="value" name={t('contributionReports.amount')} radius={[0, 10, 10, 0]} maxBarSize={26}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={6}
                style={chartValueLabel}
                formatter={(value) => chartMoneyText(value, locale)}
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
  money,
}: {
  title: string
  data: { key?: string; name: string; value: number; fill: string }[]
  total: number
  locale: string
  centerLabel: string
  money?: boolean
}) {
  const format = money ? formatGroupedNumber : formatNumber
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
                formatter={(value) => (money ? chartMoneyText(value, locale) : chartValueText(value, locale))}
              />
            </Pie>
            <Tooltip content={<ReportTooltip money={money} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink-900">{format(total, locale)}</span>
          <span className="text-[11px] text-ink-400">{centerLabel}</span>
        </div>
      </div>
      <ChartLegend items={data} total={total} locale={locale} money={money} />
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
  money,
}: {
  items: { name: string; value: number; fill: string }[]
  total: number
  locale: string
  money?: boolean
}) {
  const { t } = useTranslation()
  const format = money ? formatGroupedNumber : formatNumber
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-ink-700">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} aria-hidden />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap text-ink-900">
            <span className="font-semibold">{format(item.value, locale)}</span>
            <span className="text-[11px] text-ink-400">
              {t('contributionReports.percent', {
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
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string | number
  money?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!active || !payload?.length) return null
  const format = money ? formatGroupedNumber : formatNumber
  const unit = money ? t('participations.toman') : t('contributionReports.count')

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
