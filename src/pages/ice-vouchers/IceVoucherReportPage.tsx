import { Banknote, CalendarDays, Coins, ScrollText, Snowflake, Wallet, type LucideIcon } from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { currentPersianYear, formatDate, formatGroupedNumber, formatNumber, persianYearOptions } from '../../lib/datetime'
import type { IceVoucherReport } from '../../types/app'

const chartAxisTick = { fill: '#7a756c', fontSize: 12 }

function parseYear(raw: string | null, fallback: number) {
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

export function IceVoucherReportPage() {
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
    queryKey: ['ice-vouchers', 'report', year],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherReport>('/ice-vouchers/report', {
        params: { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const issuedCount = report?.issuedCount ?? 0
  const moldCount = report?.moldCount ?? 0
  const totalCost = report?.totalCost ?? 0
  const paidCount = report?.paidCount ?? 0
  const paidCost = report?.paidCost ?? 0
  const unpaidCount = report?.unpaidCount ?? 0
  const unpaidCost = report?.unpaidCost ?? 0
  const byDay = (report?.byDay ?? []).map((row) => ({
    ...row,
    label: formatDate(row.date, locale),
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader title={t('menus.iceVoucherReport')} subtitle={t('iceVoucherReports.subtitle')} />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('iceVoucherReports.year')} htmlFor="ice-report-year">
            <SearchSelect
              id="ice-report-year"
              value={String(year)}
              placeholder={t('iceVoucherReports.selectYear')}
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
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              icon={ScrollText}
              tone="bg-teal-50 text-teal-700"
              label={t('iceVoucherReports.issuedCount')}
              value={formatNumber(issuedCount, locale)}
              hint={t('iceVoucherReports.issuedCountHint')}
            />
            <KpiCard
              icon={Coins}
              tone="bg-gold-50 text-gold-600"
              label={t('iceVoucherReports.issuedCost')}
              value={`${formatGroupedNumber(totalCost, locale)} ${t('logisticsSettings.toman')}`}
              hint={t('iceVoucherReports.issuedCostHint')}
            />
            <KpiCard
              icon={Snowflake}
              tone="bg-teal-50 text-teal-600"
              label={t('iceVoucherReports.issuedMolds')}
              value={formatNumber(moldCount, locale)}
              hint={t('iceVoucherReports.issuedMoldsHint')}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Wallet}
              tone="bg-teal-50 text-teal-700"
              label={t('iceVoucherReports.paidCount')}
              value={formatNumber(paidCount, locale)}
              hint={t('iceVoucherReports.paidCountHint')}
            />
            <KpiCard
              icon={Banknote}
              tone="bg-gold-50 text-gold-600"
              label={t('iceVoucherReports.unpaidCount')}
              value={formatNumber(unpaidCount, locale)}
              hint={t('iceVoucherReports.unpaidCountHint')}
            />
            <KpiCard
              icon={Coins}
              tone="bg-teal-50 text-teal-600"
              label={t('iceVoucherReports.paidCost')}
              value={`${formatGroupedNumber(paidCost, locale)} ${t('logisticsSettings.toman')}`}
              hint={t('iceVoucherReports.paidCostHint')}
            />
            <KpiCard
              icon={Coins}
              tone="bg-gold-50 text-gold-600"
              label={t('iceVoucherReports.unpaidCost')}
              value={`${formatGroupedNumber(unpaidCost, locale)} ${t('logisticsSettings.toman')}`}
              hint={t('iceVoucherReports.unpaidCostHint')}
            />
          </section>

          {issuedCount === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('iceVoucherReports.empty')}
            </p>
          ) : (
            <article className={`${cardClassName} p-5`}>
              <h2 className="mb-4 text-sm font-medium text-ink-500">{t('iceVoucherReports.byDay')}</h2>
              <div className="h-80" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDay} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barCategoryGap="28%">
                    <CartesianGrid stroke="#eceae3" vertical={false} />
                    <XAxis dataKey="label" tick={chartAxisTick} axisLine={false} tickLine={false} />
                    <YAxis
                      allowDecimals={false}
                      tick={chartAxisTick}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      tickFormatter={(value: number) => formatNumber(value, locale)}
                    />
                    <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                    <Bar
                      dataKey="voucherCount"
                      name={t('iceVoucherReports.count')}
                      fill="#148f8a"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={42}
                    />
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
        <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-ink-400">{hint}</p> : null}
      </div>
    </article>
  )
}

function ReportTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: { totalCost?: number } }[]
  label?: string | number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!active || !payload?.length) return null
  const cost = payload[0]?.payload?.totalCost ?? 0

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
              {formatNumber(Number(item.value ?? 0), locale)} {t('iceVoucherReports.count')}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-6 pt-1">
          <span className="text-ink-700">{t('iceVoucherReports.cost')}</span>
          <span className="font-semibold text-ink-900">
            {formatGroupedNumber(cost, locale)} {t('logisticsSettings.toman')}
          </span>
        </li>
      </ul>
    </div>
  )
}
