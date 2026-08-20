import {
  CircleCheck,
  CircleX,
  BadgeCheck,
  Building2,
  CalendarDays,
  Mars,
  UserRoundCheck,
  UserRoundX,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  genderTypes,
  managementTypes,
  type AccommodationReport,
  type GenderType,
  type ManagementType,
} from '../../types/app'

const genderOrder: GenderType[] = [
  genderTypes.FEMALE,
  genderTypes.MALE,
  genderTypes.MIXED,
]

const managementOrder: ManagementType[] = [
  managementTypes.SELF_SUFFICIENT,
  managementTypes.SEMI_SELF_SUFFICIENT,
  managementTypes.NON_SELF_SUFFICIENT,
]

const genderColors: Record<GenderType, string> = {
  FEMALE: '#2ebdb6',
  MALE: '#e8b83a',
  MIXED: '#7a756c',
}

const genderIcon: Record<GenderType, LucideIcon> = {
  FEMALE: Venus,
  MALE: Mars,
  MIXED: Users,
}

const genderTone: Record<GenderType, string> = {
  FEMALE: 'bg-teal-50 text-teal-700',
  MALE: 'bg-gold-50 text-gold-600',
  MIXED: 'bg-cream-100 text-ink-700',
}

const managementColors: Record<ManagementType, string> = {
  SELF_SUFFICIENT: '#148f8a',
  SEMI_SELF_SUFFICIENT: '#5ed4ce',
  NON_SELF_SUFFICIENT: '#f5cd6a',
}

const managementTone: Record<ManagementType, string> = {
  SELF_SUFFICIENT: 'bg-teal-50 text-teal-700',
  SEMI_SELF_SUFFICIENT: 'bg-teal-50 text-teal-600',
  NON_SELF_SUFFICIENT: 'bg-gold-50 text-gold-600',
}

const chartAxisTick = { fill: '#7a756c', fontSize: 12 }

function percentOf(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function parseYear(raw: string | null, fallback: number) {
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

export function AccommodationReportPage() {
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
    queryKey: ['accommodations', 'report', year],
    queryFn: async () => {
      const { data } = await api.get<AccommodationReport>('/accommodations/report', {
        params: { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const genderCounts = Object.fromEntries(
    (report?.byGenderType ?? []).map((row) => [row.genderType, row.count]),
  ) as Record<GenderType, number>
  const managementCounts = Object.fromEntries(
    (report?.byManagementType ?? []).map((row) => [row.managementType, row.count]),
  ) as Record<ManagementType, number>
  const comboCounts = Object.fromEntries(
    (report?.byCombination ?? []).map((row) => [
      `${row.genderType}:${row.managementType}`,
      row.count,
    ]),
  ) as Record<string, number>
  const withManager = report?.byManagerStatus?.withManager ?? 0
  const withoutManager = report?.byManagerStatus?.withoutManager ?? 0
  const activeInYear = report?.byYearActivity?.active ?? 0
  const inactiveInYear = report?.byYearActivity?.inactive ?? 0
  const total = report?.total ?? 0

  const managerStatusData = [
    {
      key: 'withManager',
      name: t('accommodations.reportHasManager'),
      value: withManager,
      fill: '#2ebdb6',
    },
    {
      key: 'withoutManager',
      name: t('accommodations.reportNoManager'),
      value: withoutManager,
      fill: '#e8b83a',
    },
  ]

  const yearActivityData = [
    {
      key: 'active',
      name: t('accommodations.reportActive'),
      value: activeInYear,
      fill: '#148f8a',
    },
    {
      key: 'inactive',
      name: t('accommodations.reportInactive'),
      value: inactiveInYear,
      fill: '#e8b83a',
    },
  ]

  const genderPieData = genderOrder.map((genderType) => ({
    name: t(`genderTypes.${genderType}`),
    value: genderCounts[genderType] ?? 0,
    fill: genderColors[genderType],
  }))
  const managementDonutData = managementOrder.map((managementType) => ({
    name: t(`managementTypes.${managementType}`),
    value: managementCounts[managementType] ?? 0,
    fill: managementColors[managementType],
  }))
  const combinationBarData = genderOrder.map((genderType) => ({
    name: t(`genderTypes.${genderType}`),
    ...Object.fromEntries(
      managementOrder.map((managementType) => [
        managementType,
        comboCounts[`${genderType}:${managementType}`] ?? 0,
      ]),
    ),
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.accommodationReport')}
        subtitle={t('accommodations.reportSubtitle')}
      />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('accommodations.reportYear')} htmlFor="report-year">
            <SearchSelect
              id="report-year"
              value={String(year)}
              placeholder={t('accommodations.reportYearPlaceholder')}
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
          <section className="grid gap-4 lg:grid-cols-2">
            <article className={`${cardClassName} p-5`}>
              <h2 className="mb-4 text-sm font-medium text-ink-500">
                {t('accommodations.reportByManagerStatus')}
              </h2>
              <div className="relative h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={managerStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {managerStatusData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ReportTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-ink-900">
                    {formatNumber(total, locale)}
                  </span>
                  <span className="text-[11px] text-ink-400">{t('accommodations.reportTotal')}</span>
                </div>
              </div>
              <ChartLegend items={managerStatusData} total={total} locale={locale} />
            </article>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <KpiCard
                icon={Building2}
                tone="bg-teal-50 text-teal-700"
                label={t('accommodations.reportTotal')}
                value={formatNumber(total, locale)}
              />
              <KpiCard
                icon={UserRoundCheck}
                tone="bg-teal-50 text-teal-700"
                label={t('accommodations.reportHasManager')}
                value={formatNumber(withManager, locale)}
                hint={t('accommodations.reportPercent', {
                  value: formatNumber(percentOf(withManager, total), locale),
                })}
              />
              <KpiCard
                icon={UserRoundX}
                tone="bg-gold-50 text-gold-600"
                label={t('accommodations.reportNoManager')}
                value={formatNumber(withoutManager, locale)}
                hint={t('accommodations.reportPercent', {
                  value: formatNumber(percentOf(withoutManager, total), locale),
                })}
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className={`${cardClassName} p-5`}>
              <h2 className="mb-4 text-sm font-medium text-ink-500">
                {t('accommodations.reportByYearActivity')}
              </h2>
              <div className="relative h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={yearActivityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {yearActivityData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ReportTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-ink-900">
                    {formatNumber(total, locale)}
                  </span>
                  <span className="text-[11px] text-ink-400">{t('accommodations.reportTotal')}</span>
                </div>
              </div>
              <ChartLegend items={yearActivityData} total={total} locale={locale} />
            </article>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <KpiCard
                icon={CircleCheck}
                tone="bg-teal-50 text-teal-700"
                label={t('accommodations.reportActive')}
                value={formatNumber(activeInYear, locale)}
                hint={t('accommodations.reportPercent', {
                  value: formatNumber(percentOf(activeInYear, total), locale),
                })}
              />
              <KpiCard
                icon={CircleX}
                tone="bg-gold-50 text-gold-600"
                label={t('accommodations.reportInactive')}
                value={formatNumber(inactiveInYear, locale)}
                hint={t('accommodations.reportPercent', {
                  value: formatNumber(percentOf(inactiveInYear, total), locale),
                })}
              />
            </div>
          </section>

          {total === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('accommodations.reportEmpty')}
            </p>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {genderOrder.map((genderType) => (
                  <KpiCard
                    key={genderType}
                    icon={genderIcon[genderType]}
                    tone={genderTone[genderType]}
                    label={t(`genderTypes.${genderType}`)}
                    value={formatNumber(genderCounts[genderType] ?? 0, locale)}
                    hint={t('accommodations.reportPercent', {
                      value: formatNumber(percentOf(genderCounts[genderType] ?? 0, total), locale),
                    })}
                  />
                ))}
              </section>
              <section className="grid gap-4 lg:grid-cols-2">
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('accommodations.reportByGenderType')}
                  </h2>
                  <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={96}
                          paddingAngle={3}
                          stroke="#ffffff"
                          strokeWidth={3}
                        >
                          {genderPieData.map((item) => (
                            <Cell key={item.name} fill={item.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ReportTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegend items={genderPieData} total={total} locale={locale} />
                </article>

                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('accommodations.reportByManagementType')}
                  </h2>
                  <div className="relative h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={managementDonutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={96}
                          paddingAngle={3}
                          cornerRadius={6}
                          stroke="#ffffff"
                          strokeWidth={3}
                        >
                          {managementDonutData.map((item) => (
                            <Cell key={item.name} fill={item.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ReportTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-semibold text-ink-900">
                        {formatNumber(total, locale)}
                      </span>
                      <span className="text-[11px] text-ink-400">{t('accommodations.reportTotal')}</span>
                    </div>
                  </div>
                  <ChartLegend items={managementDonutData} total={total} locale={locale} />
                </article>
              </section>

              <section className="grid gap-4 sm:grid-cols-3">
                {managementOrder.map((managementType) => (
                  <KpiCard
                    key={managementType}
                    icon={BadgeCheck}
                    tone={managementTone[managementType]}
                    label={t(`managementTypes.${managementType}`)}
                    value={formatNumber(managementCounts[managementType] ?? 0, locale)}
                    hint={t('accommodations.reportPercent', {
                      value: formatNumber(
                        percentOf(managementCounts[managementType] ?? 0, total),
                        locale,
                      ),
                    })}
                  />
                ))}
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-medium text-ink-500">
                  {t('accommodations.reportByCombination')}
                </h2>
                <article className={`${cardClassName} p-5`}>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={combinationBarData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
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
                        <Tooltip
                          cursor={{ fill: '#eefaf9' }}
                          content={<ReportTooltip />}
                        />
                        {managementOrder.map((managementType) => (
                          <Bar
                            key={managementType}
                            dataKey={managementType}
                            name={t(`managementTypes.${managementType}`)}
                            fill={managementColors[managementType]}
                            radius={[10, 10, 0, 0]}
                            maxBarSize={36}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ink-500">
                    {managementOrder.map((managementType) => (
                      <li key={managementType} className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: managementColors[managementType] }}
                          aria-hidden
                        />
                        {t(`managementTypes.${managementType}`)}
                      </li>
                    ))}
                  </ul>
                </article>
                <div className="grid gap-4 lg:grid-cols-3">
                  {genderOrder.map((genderType) => (
                    <article key={genderType} className={`${cardClassName} p-5`}>
                      <GenderHeading genderType={genderType} />
                      <div className="space-y-3">
                        {managementOrder.map((managementType) => {
                          const count = comboCounts[`${genderType}:${managementType}`] ?? 0
                          return (
                            <div
                              key={managementType}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-cream-50 px-3 py-2.5"
                            >
                              <p className="text-sm text-ink-700">
                                {t('accommodations.reportCombination', {
                                  gender: t(`genderTypes.${genderType}`),
                                  management: t(`managementTypes.${managementType}`),
                                })}
                              </p>
                              <p className="text-base font-semibold text-ink-900">
                                {formatNumber(count, locale)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
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

function GenderHeading({ genderType }: { genderType: GenderType }) {
  const { t } = useTranslation()
  const Icon = genderIcon[genderType]
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className={`flex size-9 items-center justify-center rounded-2xl ${genderTone[genderType]}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <h3 className="text-sm font-medium text-ink-900">{t(`genderTypes.${genderType}`)}</h3>
    </div>
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
              {t('accommodations.reportPercent', {
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
      dir="rtl"
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
              {formatNumber(Number(item.value ?? 0), locale)} {t('accommodations.reportCount')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
