import {
  Banknote,
  CalendarDays,
  HandCoins,
  HandHeart,
  Package,
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
  LabelList,
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
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import {
  currentPersianYear,
  formatGroupedNumber,
  formatGroupedQuantity,
  formatNumber,
  persianYearOptions,
} from '../../lib/datetime'
import type { ContributionGood, ContributionGoodsReport } from '../../types/app'

const ALL_YEARS = 'all'
const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

function chartQuantityText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatGroupedQuantity(n, locale) : ''
}

function parseYearParam(raw: string | null, fallback: number): number | null {
  if (raw === ALL_YEARS) return null
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

export function ContributionGoodsReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYearParam(yearFromUrl, currentYear)
  const yearSelectValue = year == null ? ALL_YEARS : String(year)
  const goodsId = searchParams.get('goodsId') ?? ''

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: ALL_YEARS })
  }, [setParams, yearFromUrl])

  const goods = useQuery({
    queryKey: ['contribution-goods', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ContributionGood[]>('/contribution-goods', {
        params: { sortBy: 'name', sortDir: 'asc' },
      })
      return data
    },
  })

  const query = useQuery({
    queryKey: ['contributions', 'goods-report', goodsId, year],
    queryFn: async () => {
      const { data } = await api.get<ContributionGoodsReport>('/contributions/goods-report', {
        params: {
          goodsId,
          ...(year == null ? {} : { year }),
        },
      })
      return data
    },
    enabled: Boolean(goodsId),
    placeholderData: keepPreviousData,
  })

  const report = goodsId ? query.data : undefined
  const selectedGoods = (goods.data ?? []).find((item) => item.id === goodsId)
  const goodsName = report?.goods.name ?? selectedGoods?.name

  const yearOptions = [
    { value: ALL_YEARS, label: t('contributionGoodsReports.allYears') },
    ...persianYearOptions(locale, year ?? currentYear),
  ]

  const timeRows = year == null ? (report?.byYear ?? []) : (report?.byMonth ?? [])
  const timeBarData = timeRows.map((row) => ({
    name:
      year == null
        ? formatNumber(row.year ?? 0, locale)
        : t(`contributionReports.months.${row.month}`),
    quantity: row.quantity,
    amount: row.amount,
    count: row.count,
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.contributionsGoodsReport')}
        subtitle={goodsName ?? t('contributionGoodsReports.subtitle')}
      />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            icon={Package}
            label={t('contributionGoodsReports.goods')}
            htmlFor="contribution-goods-report-goods"
          >
            <SearchSelect
              id="contribution-goods-report-goods"
              value={goodsId}
              placeholder={t('contributionGoodsReports.selectGoods')}
              onChange={(next) => setParams({ goodsId: next || undefined })}
              options={(goods.data ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </FormField>
          <FormField
            icon={CalendarDays}
            label={t('contributionGoodsReports.year')}
            htmlFor="contribution-goods-report-year"
          >
            <SearchSelect
              id="contribution-goods-report-year"
              value={yearSelectValue}
              placeholder={t('contributionGoodsReports.selectYear')}
              onChange={(next) => setParams({ year: next || ALL_YEARS })}
              options={yearOptions}
            />
          </FormField>
        </div>
      </article>

      {!goodsId ? (
        <FormEmptyHint>{t('contributionGoodsReports.selectGoodsHint')}</FormEmptyHint>
      ) : query.isLoading && !report ? (
        <LoadingState />
      ) : query.isError || !report ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      ) : (
        <div className={`space-y-6 ${query.isFetching ? 'opacity-70' : ''}`}>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Package}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionGoodsReports.totalQuantity')}
              value={formatGroupedQuantity(report.totalQuantity, locale)}
              hint={report.unitName ?? undefined}
            />
            <KpiCard
              icon={HandCoins}
              tone="bg-mint-50 text-mint-600"
              label={t('contributionGoodsReports.totalCount')}
              value={formatNumber(report.totalCount, locale)}
            />
            <KpiCard
              icon={Banknote}
              tone="bg-teal-50 text-teal-700"
              label={t('contributionGoodsReports.totalAmount')}
              value={formatGroupedNumber(report.totalAmount, locale)}
              hint={t('participations.toman')}
            />
            <KpiCard
              icon={HandHeart}
              tone="bg-mint-50 text-mint-600"
              label={t('contributionGoodsReports.benefactorCount')}
              value={formatNumber(report.benefactorCount, locale)}
            />
          </section>

          {report.totalCount === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('contributionGoodsReports.empty')}
            </p>
          ) : (
            <article className={`${cardClassName} p-5`}>
              <h2 className="mb-4 text-sm font-medium text-ink-500">
                {year == null
                  ? t('contributionGoodsReports.byYear')
                  : t('contributionGoodsReports.byMonth')}
              </h2>
              <div className="h-80" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeBarData}
                    margin={{ top: 28, right: 8, left: 0, bottom: 8 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid stroke="#eceae3" vertical={false} />
                    <XAxis dataKey="name" tick={chartAxisTick} axisLine={false} tickLine={false} />
                    <YAxis
                      allowDecimals
                      tick={chartAxisTick}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tickFormatter={(value: number) => formatGroupedQuantity(value, locale)}
                    />
                    <Tooltip cursor={{ fill: '#eefaf9' }} content={<GoodsReportTooltip />} />
                    <Bar
                      dataKey="quantity"
                      name={t('contributionGoodsReports.quantity')}
                      fill="#2ebdb6"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={36}
                    >
                      <LabelList
                        dataKey="quantity"
                        position="top"
                        offset={6}
                        style={chartValueLabel}
                        formatter={(value) => chartQuantityText(value, locale)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
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
        <p className="mt-1 truncate text-2xl font-semibold text-ink-900">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-[11px] text-ink-400">{hint}</p> : null}
      </div>
    </article>
  )
}

function GoodsReportTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload?: { quantity?: number; amount?: number; count?: number } }[]
  label?: string | number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  return (
    <div
      className="rounded-2xl border border-line bg-white px-3 py-2.5 text-sm shadow-[0_10px_30px_rgba(20,40,40,0.08)]"
      dir={languageDir(locale)}
    >
      {label ? <p className="mb-1.5 font-medium text-ink-900">{label}</p> : null}
      <ul className="space-y-1">
        <li className="flex items-center justify-between gap-6">
          <span className="text-ink-700">{t('contributionGoodsReports.quantity')}</span>
          <span className="font-semibold text-ink-900">
            {formatGroupedQuantity(Number(row.quantity ?? 0), locale)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-6">
          <span className="text-ink-700">{t('contributionGoodsReports.totalCount')}</span>
          <span className="font-semibold text-ink-900">
            {formatNumber(Number(row.count ?? 0), locale)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-6">
          <span className="text-ink-700">{t('contributionGoodsReports.totalAmount')}</span>
          <span className="font-semibold text-ink-900">
            {formatGroupedNumber(Number(row.amount ?? 0), locale)} {t('participations.toman')}
          </span>
        </li>
      </ul>
    </div>
  )
}
