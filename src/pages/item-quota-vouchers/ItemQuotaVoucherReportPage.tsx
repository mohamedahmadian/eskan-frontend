import {
  Boxes,
  CalendarDays,
  Package,
  ScrollText,
  Store,
  UserRound,
  Warehouse,
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
import { TableCard } from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatDate, formatNumber, persianYearOptions } from '../../lib/datetime'
import { formatItemUnit, type ItemQuotaVoucherReport } from '../../types/app'

const COLORS = {
  quota: '#2ebdb6',
  issued: '#148f8a',
  remaining: '#e8b83a',
  vouchers: '#5ed4ce',
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

export function ItemQuotaVoucherReportPage() {
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
    queryKey: ['item-quota-vouchers', 'report', year],
    queryFn: async () => {
      const { data } = await api.get<ItemQuotaVoucherReport>('/item-quota-vouchers/report', {
        params: { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const issuedCount = report?.issuedCount ?? 0
  const issuedQuantity = report?.issuedQuantity ?? 0
  const quotaQuantity = report?.quotaQuantity ?? 0
  const remainingQuantity = report?.remainingQuantity ?? 0
  const quotaCount = report?.quotaCount ?? 0
  const managerCount = report?.managerCount ?? 0

  const overviewBars = [
    { key: 'quota', name: t('voucherReports.quota'), value: quotaQuantity, fill: COLORS.quota },
    { key: 'issued', name: t('voucherReports.issued'), value: issuedQuantity, fill: COLORS.issued },
    { key: 'remaining', name: t('voucherReports.remaining'), value: remainingQuantity, fill: COLORS.remaining },
  ]

  const quotaSplit = [
    { key: 'issued', name: t('voucherReports.issued'), value: issuedQuantity, fill: COLORS.issued },
    { key: 'remaining', name: t('voucherReports.remaining'), value: remainingQuantity, fill: COLORS.remaining },
  ]

  const byQuota = report?.byQuota ?? []
  const quotaTotals = byQuota.reduce(
    (acc, row) => ({
      quotaQuantity: acc.quotaQuantity + row.quotaQuantity,
      issuedQuantity: acc.issuedQuantity + row.issuedQuantity,
      remainingQuantity: acc.remainingQuantity + row.remainingQuantity,
      voucherCount: acc.voucherCount + row.voucherCount,
    }),
    { quotaQuantity: 0, issuedQuantity: 0, remainingQuantity: 0, voucherCount: 0 },
  )

  const itemBars = (report?.byItem ?? []).slice(0, 8).map((row) => ({
    name: row.itemName,
    quota: row.quotaQuantity,
    issued: row.issuedQuantity,
    remaining: row.remainingQuantity,
  }))

  const supplierBars = (report?.bySupplier ?? []).slice(0, 8).map((row) => ({
    name: row.supplierName || t('itemQuotas.unspecifiedSupplier'),
    issued: row.issuedQuantity,
    vouchers: row.voucherCount,
  }))

  const managerBars = (report?.byManager ?? []).slice(0, 8).map((row) => ({
    name: row.managerName,
    issued: row.issuedQuantity,
    vouchers: row.voucherCount,
  }))

  const byDay = (report?.byDay ?? []).map((row) => ({
    ...row,
    label: formatDate(row.date, locale),
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader title={t('menus.voucherReport')} subtitle={t('voucherReports.subtitle')} />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('voucherReports.year')} htmlFor="voucher-report-year">
            <SearchSelect
              id="voucher-report-year"
              value={String(year)}
              placeholder={t('voucherReports.selectYear')}
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
              icon={ScrollText}
              tone="bg-teal-50 text-teal-700"
              label={t('voucherReports.issuedCount')}
              value={formatNumber(issuedCount, locale)}
              hint={t('voucherReports.issuedCountHint')}
            />
            <KpiCard
              icon={Package}
              tone="bg-teal-50 text-teal-600"
              label={t('voucherReports.issuedQuantity')}
              value={formatNumber(issuedQuantity, locale)}
              hint={t('voucherReports.percentOfQuota', {
                value: formatNumber(percentOf(issuedQuantity, quotaQuantity), locale),
              })}
            />
            <KpiCard
              icon={Boxes}
              tone="bg-teal-50 text-teal-700"
              label={t('voucherReports.quotaQuantity')}
              value={formatNumber(quotaQuantity, locale)}
              hint={t('voucherReports.quotaQuantityHint')}
            />
            <KpiCard
              icon={Warehouse}
              tone="bg-gold-50 text-gold-600"
              label={t('voucherReports.remainingQuantity')}
              value={formatNumber(remainingQuantity, locale)}
              hint={t('voucherReports.percentOfQuota', {
                value: formatNumber(percentOf(remainingQuantity, quotaQuantity), locale),
              })}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              icon={Package}
              tone="bg-cream-100 text-ink-700"
              label={t('voucherReports.quotaCount')}
              value={formatNumber(quotaCount, locale)}
              hint={t('voucherReports.quotaCountHint')}
            />
            <KpiCard
              icon={UserRound}
              tone="bg-gold-50 text-gold-600"
              label={t('voucherReports.managerCount')}
              value={formatNumber(managerCount, locale)}
              hint={t('voucherReports.managerCountHint')}
            />
            <KpiCard
              icon={Store}
              tone="bg-teal-50 text-teal-600"
              label={t('voucherReports.supplierCount')}
              value={formatNumber(report?.supplierCount ?? 0, locale)}
              hint={t('voucherReports.supplierCountHint')}
            />
          </section>

          {quotaCount === 0 && issuedCount === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('voucherReports.empty')}
            </p>
          ) : (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('voucherReports.overviewChart')}
                  </h2>
                  <div className="h-72" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overviewBars}
                        margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                        barCategoryGap="28%"
                      >
                        <CartesianGrid stroke="#eceae3" vertical={false} />
                        <XAxis dataKey="name" tick={chartAxisTick} axisLine={false} tickLine={false} />
                        <YAxis
                          allowDecimals={false}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                          tickFormatter={(value: number) => formatNumber(value, locale)}
                        />
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                        <Bar dataKey="value" name={t('voucherReports.quantity')} radius={[10, 10, 0, 0]} maxBarSize={42}>
                          {overviewBars.map((item) => (
                            <Cell key={item.key} fill={item.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('voucherReports.quotaSplit')}
                  </h2>
                  {quotaQuantity === 0 ? (
                    <p className="px-1 py-16 text-center text-sm text-ink-500">{t('voucherReports.emptyQuota')}</p>
                  ) : (
                    <>
                      <div className="relative h-64" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={quotaSplit}
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
                              {quotaSplit.map((item) => (
                                <Cell key={item.key} fill={item.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<ReportTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-semibold text-ink-900">
                            {formatNumber(quotaQuantity, locale)}
                          </span>
                          <span className="text-[11px] text-ink-400">{t('voucherReports.quota')}</span>
                        </div>
                      </div>
                      <ChartLegend items={quotaSplit} total={quotaQuantity} locale={locale} />
                    </>
                  )}
                </article>
              </section>

              {byQuota.length > 0 ? (
                <TableCard empty={t('voucherReports.empty')} hasRows rowClick={false}>
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 text-ink-700">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.itemName')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.supplier')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.unit')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.quotaQty')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.issuedQty')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.remainingQty')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.voucherCount')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('voucherReports.utilization')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byQuota.map((row) => (
                        <tr key={row.quotaId} className="border-t border-line">
                          <td className="px-4 py-3">{row.itemName}</td>
                          <td className="px-4 py-3">{row.supplierName || t('itemQuotas.unspecifiedSupplier')}</td>
                          <td className="px-4 py-3">{formatItemUnit(row.unit, t)}</td>
                          <td className="px-4 py-3">{formatNumber(row.quotaQuantity, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.issuedQuantity, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.remainingQuantity, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.voucherCount, locale)}</td>
                          <td className="px-4 py-3">
                            {t('voucherReports.percent', {
                              value: formatNumber(percentOf(row.issuedQuantity, row.quotaQuantity), locale),
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-line bg-cream-50 font-medium text-ink-900">
                        <td className="px-4 py-3" colSpan={3}>{t('voucherReports.total')}</td>
                        <td className="px-4 py-3">{formatNumber(quotaTotals.quotaQuantity, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(quotaTotals.issuedQuantity, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(quotaTotals.remainingQuantity, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(quotaTotals.voucherCount, locale)}</td>
                        <td className="px-4 py-3">
                          {t('voucherReports.percent', {
                            value: formatNumber(
                              percentOf(quotaTotals.issuedQuantity, quotaTotals.quotaQuantity),
                              locale,
                            ),
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </TableCard>
              ) : null}

              {itemBars.length > 0 ? (
                <article className={`${cardClassName} p-5`}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <Package className="size-4" aria-hidden />
                    </span>
                    <h2 className="text-sm font-medium text-ink-900">{t('voucherReports.byItem')}</h2>
                  </div>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={itemBars}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        barCategoryGap="22%"
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
                          width={118}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                        <Bar dataKey="quota" name={t('voucherReports.quota')} fill={COLORS.quota} radius={[0, 10, 10, 0]} maxBarSize={14} />
                        <Bar dataKey="issued" name={t('voucherReports.issued')} fill={COLORS.issued} radius={[0, 10, 10, 0]} maxBarSize={14} />
                        <Bar dataKey="remaining" name={t('voucherReports.remaining')} fill={COLORS.remaining} radius={[0, 10, 10, 0]} maxBarSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              ) : null}

              {supplierBars.length > 0 ? (
                <article className={`${cardClassName} p-5`}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <Store className="size-4" aria-hidden />
                    </span>
                    <h2 className="text-sm font-medium text-ink-900">{t('voucherReports.bySupplier')}</h2>
                  </div>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={supplierBars}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        barCategoryGap="22%"
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
                          width={118}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                        <Bar dataKey="issued" name={t('voucherReports.issued')} fill={COLORS.issued} radius={[0, 10, 10, 0]} maxBarSize={16} />
                        <Bar dataKey="vouchers" name={t('voucherReports.voucherCount')} fill={COLORS.vouchers} radius={[0, 10, 10, 0]} maxBarSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              ) : null}

              {managerBars.length > 0 ? (
                <article className={`${cardClassName} p-5`}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
                      <UserRound className="size-4" aria-hidden />
                    </span>
                    <h2 className="text-sm font-medium text-ink-900">{t('voucherReports.byManager')}</h2>
                  </div>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={managerBars}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        barCategoryGap="22%"
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
                          width={118}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                        <Bar dataKey="issued" name={t('voucherReports.issued')} fill={COLORS.issued} radius={[0, 10, 10, 0]} maxBarSize={16} />
                        <Bar dataKey="vouchers" name={t('voucherReports.voucherCount')} fill={COLORS.vouchers} radius={[0, 10, 10, 0]} maxBarSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              ) : null}

              {byDay.length > 0 ? (
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">{t('voucherReports.byDay')}</h2>
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
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<DayTooltip />} />
                        <Bar
                          dataKey="voucherCount"
                          name={t('voucherReports.voucherCount')}
                          fill={COLORS.issued}
                          radius={[10, 10, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              ) : null}
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
              {t('voucherReports.percent', {
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
              {formatNumber(Number(item.value ?? 0), locale)} {t('voucherReports.quantity')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DayTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: { issuedQuantity?: number } }[]
  label?: string | number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!active || !payload?.length) return null
  const quantity = payload[0]?.payload?.issuedQuantity ?? 0

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
              {formatNumber(Number(item.value ?? 0), locale)}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-6 pt-1">
          <span className="text-ink-700">{t('voucherReports.issuedQuantity')}</span>
          <span className="font-semibold text-ink-900">{formatNumber(quantity, locale)}</span>
        </li>
      </ul>
    </div>
  )
}
