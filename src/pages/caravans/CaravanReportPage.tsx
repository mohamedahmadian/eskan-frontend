import {
  CalendarDays,
  Tent,
  UserRoundCog,
  Users,
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
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import {
  caravanGenderKinds,
  caravanOrigins,
  type CaravanGenderKind,
  type CaravanOrigin,
  type CaravanReport,
} from '../../types/app'

const genderOrder: CaravanGenderKind[] = [
  caravanGenderKinds.FEMALE,
  caravanGenderKinds.MALE,
  caravanGenderKinds.MIXED,
  caravanGenderKinds.UNSPECIFIED,
]

const originOrder: CaravanOrigin[] = [
  caravanOrigins.IRANIAN,
  caravanOrigins.INTERNATIONAL,
]

const genderColors: Record<CaravanGenderKind, string> = {
  FEMALE: '#2ebdb6',
  MALE: '#e8b83a',
  MIXED: '#7a756c',
  UNSPECIFIED: '#c5bfb4',
}

const originColors: Record<CaravanOrigin, string> = {
  IRANIAN: '#148f8a',
  INTERNATIONAL: '#e8b83a',
}

const seriesPalette = ['#148f8a', '#2ebdb6', '#5ed4ce', '#e8b83a', '#f5cd6a', '#7a756c']

const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

function chartValueText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatNumber(n, locale) : ''
}

function percentOf(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function parseYear(raw: string | null, fallback: number) {
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

export function CaravanReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYear(yearFromUrl, currentYear)

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: String(currentYear) })
  }, [currentYear, setParams, yearFromUrl])

  const query = useQuery({
    queryKey: ['caravans', 'report', year],
    queryFn: async () => {
      const { data } = await api.get<CaravanReport>('/caravans/report', {
        params: { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const genderCounts = Object.fromEntries(
    (report?.byGenderType ?? []).map((row) => [row.genderType, row.count]),
  ) as Record<CaravanGenderKind, number>
  const comboCounts = Object.fromEntries(
    (report?.byCombination ?? []).map((row) => [
      `${row.genderType}:${row.origin}`,
      row.count,
    ]),
  ) as Record<string, number>
  const withManager = report?.byManagerStatus?.withManager ?? 0
  const withoutManager = report?.byManagerStatus?.withoutManager ?? 0
  const activeInYear = report?.byYearActivity?.active ?? 0
  const inactiveInYear = report?.byYearActivity?.inactive ?? 0
  const iranian = report?.byOrigin?.iranian ?? 0
  const international = report?.byOrigin?.international ?? 0
  const contactsComplete = report?.byContactStatus?.complete ?? 0
  const contactsPartial = report?.byContactStatus?.partial ?? 0
  const contactsNone = report?.byContactStatus?.none ?? 0
  const total = report?.total ?? 0
  const capacityTotal = report?.capacity?.total ?? 0
  const capacityMale = report?.capacity?.male ?? 0
  const capacityFemale = report?.capacity?.female ?? 0

  const genderLabel = (kind: CaravanGenderKind) =>
    kind === caravanGenderKinds.UNSPECIFIED
      ? t('caravans.reportGenderUnspecified')
      : t(`genderTypes.${kind}`)

  const managerStatusData = [
    {
      key: 'withManager',
      name: t('caravans.reportHasManager'),
      value: withManager,
      fill: '#2ebdb6',
    },
    {
      key: 'withoutManager',
      name: t('caravans.reportNoManager'),
      value: withoutManager,
      fill: '#e8b83a',
    },
  ]

  const yearActivityData = [
    {
      key: 'active',
      name: t('caravans.reportActive'),
      value: activeInYear,
      fill: '#148f8a',
    },
    {
      key: 'inactive',
      name: t('caravans.reportInactive'),
      value: inactiveInYear,
      fill: '#e8b83a',
    },
  ]

  const originData = [
    {
      key: 'iranian',
      name: t('caravans.reportIranian'),
      value: iranian,
      fill: originColors.IRANIAN,
    },
    {
      key: 'international',
      name: t('caravans.reportInternational'),
      value: international,
      fill: originColors.INTERNATIONAL,
    },
  ]

  const contactStatusData = [
    {
      key: 'complete',
      name: t('caravans.reportContactsComplete'),
      value: contactsComplete,
      fill: '#148f8a',
    },
    {
      key: 'partial',
      name: t('caravans.reportContactsPartial'),
      value: contactsPartial,
      fill: '#e8b83a',
    },
    {
      key: 'none',
      name: t('caravans.reportContactsNone'),
      value: contactsNone,
      fill: '#7a756c',
    },
  ]

  const genderPieData = genderOrder.map((genderType) => ({
    name: genderLabel(genderType),
    value: genderCounts[genderType] ?? 0,
    fill: genderColors[genderType],
  }))

  const walkingRouteBarData = (report?.byWalkingRoute ?? []).map((row, index) => ({
    name: row.id ? row.name : t('caravans.walkingRouteNone'),
    value: row.count,
    fill: paletteColor(index),
  }))

  const provinceBarData = (report?.byProvince ?? []).map((row, index) => ({
    name: row.name,
    value: row.count,
    fill: paletteColor(index),
  }))

  const combinationBarData = genderOrder.map((genderType) => ({
    name: genderLabel(genderType),
    ...Object.fromEntries(
      originOrder.map((origin) => [
        origin,
        comboCounts[`${genderType}:${origin}`] ?? 0,
      ]),
    ),
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.caravanReport')}
        subtitle={t('caravans.reportSubtitle')}
      />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('caravans.reportYear')} htmlFor="caravan-report-year">
            <SearchSelect
              id="caravan-report-year"
              value={String(year)}
              placeholder={t('caravans.reportYearPlaceholder')}
              onChange={(next) => setParams({ year: next })}
              options={persianYearOptions(locale, year)}
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
              icon={Tent}
              tone="bg-teal-50 text-teal-700"
              label={t('caravans.reportTotal')}
              value={formatNumber(total, locale)}
            />
            <KpiCard
              icon={CalendarDays}
              tone="bg-mint-50 text-mint-600"
              label={t('caravans.reportActiveCount')}
              value={formatNumber(activeInYear, locale)}
            />
            <KpiCard
              icon={Users}
              tone="bg-teal-50 text-teal-700"
              label={t('caravans.reportCapacity')}
              value={formatNumber(capacityTotal, locale)}
              hint={t('caravans.reportCapacityHint', {
                male: formatNumber(capacityMale, locale),
                female: formatNumber(capacityFemale, locale),
              })}
            />
            <KpiCard
              icon={UserRoundCog}
              tone="bg-mint-50 text-mint-600"
              label={t('caravans.reportHasManager')}
              value={formatNumber(withManager, locale)}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <DonutCard
              title={t('caravans.reportByManagerStatus')}
              data={managerStatusData}
              total={total}
              locale={locale}
              centerLabel={t('caravans.reportTotal')}
            />
            <DonutCard
              title={t('caravans.reportByYearActivity')}
              data={yearActivityData}
              total={total}
              locale={locale}
              centerLabel={t('caravans.reportTotal')}
            />
          </section>

          {total === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('caravans.reportEmpty')}
            </p>
          ) : (
            <>
              <article className={`${cardClassName} p-5`}>
                <h2 className="mb-4 text-sm font-medium text-ink-500">
                  {t('caravans.reportByWalkingRoute')}
                </h2>
                <div
                  className="w-full"
                  style={{ height: barChartHeight(walkingRouteBarData.length) }}
                  dir="ltr"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={walkingRouteBarData}
                      layout="vertical"
                      margin={{ top: 8, right: 36, left: 8, bottom: 8 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid stroke="#eceae3" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={chartAxisTick}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) => formatNumber(value, locale)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={128}
                        tick={chartAxisTick}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                      <Bar dataKey="value" name={t('caravans.reportCount')} radius={[0, 10, 10, 0]} maxBarSize={28}>
                        {walkingRouteBarData.map((item) => (
                          <Cell key={item.name} fill={item.fill} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          offset={6}
                          style={chartValueLabel}
                          formatter={(value) => chartValueText(value, locale)}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <section className="grid gap-4 lg:grid-cols-2">
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('caravans.reportByGenderType')}
                  </h2>
                  <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={genderPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={84}
                          paddingAngle={3}
                          stroke="#ffffff"
                          strokeWidth={3}
                          labelLine={false}
                        >
                          {genderPieData.map((item) => (
                            <Cell key={item.name} fill={item.fill} />
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
                  </div>
                  <ChartLegend items={genderPieData} total={total} locale={locale} />
                </article>

                <DonutCard
                  title={t('caravans.reportByOrigin')}
                  data={originData}
                  total={total}
                  locale={locale}
                  centerLabel={t('caravans.reportTotal')}
                />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <DonutCard
                  title={t('caravans.reportByContactStatus')}
                  data={contactStatusData}
                  total={total}
                  locale={locale}
                  centerLabel={t('caravans.reportTotal')}
                />
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('caravans.reportByProvince')}
                  </h2>
                  <div
                    className="w-full"
                    style={{ height: barChartHeight(Math.min(provinceBarData.length, 12), 34, 256) }}
                    dir="ltr"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={provinceBarData.slice(0, 12)}
                        layout="vertical"
                        margin={{ top: 8, right: 36, left: 8, bottom: 8 }}
                        barCategoryGap="18%"
                      >
                        <CartesianGrid stroke="#eceae3" horizontal={false} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => formatNumber(value, locale)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={96}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                        <Bar dataKey="value" name={t('caravans.reportCount')} radius={[0, 10, 10, 0]} maxBarSize={26}>
                          {provinceBarData.slice(0, 12).map((item) => (
                            <Cell key={item.name} fill={item.fill} />
                          ))}
                          <LabelList
                            dataKey="value"
                            position="right"
                            offset={6}
                            style={chartValueLabel}
                            formatter={(value) => chartValueText(value, locale)}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-medium text-ink-500">
                  {t('caravans.reportByCombination')}
                </h2>
                <article className={`${cardClassName} p-5`}>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={combinationBarData}
                        margin={{ top: 28, right: 8, left: 0, bottom: 8 }}
                        barCategoryGap="28%"
                        barGap={6}
                      >
                        <CartesianGrid stroke="#eceae3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
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
                        {originOrder.map((origin) => (
                          <Bar
                            key={origin}
                            dataKey={origin}
                            name={
                              origin === caravanOrigins.IRANIAN
                                ? t('caravans.reportIranian')
                                : t('caravans.reportInternational')
                            }
                            fill={originColors[origin]}
                            radius={[10, 10, 0, 0]}
                            maxBarSize={36}
                          >
                            <LabelList
                              dataKey={origin}
                              position="top"
                              offset={6}
                              style={chartValueLabel}
                              formatter={(value) => chartValueText(value, locale)}
                            />
                          </Bar>
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ink-500">
                    {originOrder.map((origin) => (
                      <li key={origin} className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: originColors[origin] }}
                          aria-hidden
                        />
                        {origin === caravanOrigins.IRANIAN
                          ? t('caravans.reportIranian')
                          : t('caravans.reportInternational')}
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            </>
          )}
        </div>
      )}
    </div>
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
          <span className="text-2xl font-semibold text-ink-900">
            {formatNumber(total, locale)}
          </span>
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
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} aria-hidden />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap text-ink-900">
            <span className="font-semibold">{formatNumber(item.value, locale)}</span>
            <span className="text-[11px] text-ink-400">
              {t('caravans.reportPercent', {
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
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string | number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!active || !payload?.length) return null

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
              {formatNumber(Number(item.value ?? 0), locale)} {t('caravans.reportCount')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
