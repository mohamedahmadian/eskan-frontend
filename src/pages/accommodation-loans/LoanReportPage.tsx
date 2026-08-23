import {
  ArrowUpFromLine,
  CalendarDays,
  Package,
  PackageCheck,
  PackageMinus,
  PackageOpen,
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
import { TableCard } from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { formatItemUnit, type LoanReport } from '../../types/app'

const COLORS = {
  received: '#148f8a',
  delivered: '#2ebdb6',
  returned: '#5ed4ce',
  unreturned: '#e8b83a',
  warehouse: '#7a756c',
}

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

export function LoanReportPage() {
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
    queryKey: ['accommodation-loans', 'report', year],
    queryFn: async () => {
      const { data } = await api.get<LoanReport>('/accommodation-loans/report', {
        params: { year },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const received = report?.receivedFromSuppliers ?? 0
  const delivered = report?.deliveredToManagers ?? 0
  const returned = report?.returned ?? 0
  const unreturned = report?.unreturned ?? 0
  const warehouse = report?.warehouseRemaining ?? 0

  const overviewBars = [
    { key: 'received', name: t('loanReports.received'), value: received, fill: COLORS.received },
    { key: 'delivered', name: t('loanReports.delivered'), value: delivered, fill: COLORS.delivered },
    { key: 'returned', name: t('loanReports.returned'), value: returned, fill: COLORS.returned },
    { key: 'unreturned', name: t('loanReports.unreturned'), value: unreturned, fill: COLORS.unreturned },
  ]

  const receivedSplit = [
    { key: 'delivered', name: t('loanReports.delivered'), value: delivered, fill: COLORS.delivered },
    { key: 'warehouse', name: t('loanReports.warehouse'), value: warehouse, fill: COLORS.warehouse },
  ]

  const deliveredSplit = [
    { key: 'returned', name: t('loanReports.returned'), value: returned, fill: COLORS.returned },
    { key: 'unreturned', name: t('loanReports.unreturned'), value: unreturned, fill: COLORS.unreturned },
  ]

  const itemStock = report?.itemStock ?? []
  const stockTotals = itemStock.reduce(
    (acc, row) => ({
      quantity: acc.quantity + row.quantity,
      delivered: acc.delivered + row.delivered,
      returned: acc.returned + row.returned,
      remaining: acc.remaining + row.remaining,
    }),
    { quantity: 0, delivered: 0, returned: 0, remaining: 0 },
  )

  const itemBars = (report?.byItem ?? []).slice(0, 8).map((row) => ({
    name: row.itemName,
    received: row.received,
    delivered: row.delivered,
    returned: row.returned,
    unreturned: row.unreturned,
  }))

  const supplierBars = (report?.bySupplier ?? []).slice(0, 8).map((row) => ({
    name: row.supplierName,
    received: row.received,
    delivered: row.delivered,
    returned: row.returned,
    unreturned: row.unreturned,
  }))

  const managerBars = (report?.byManager ?? []).slice(0, 8).map((row) => ({
    name: row.managerName,
    delivered: row.delivered,
    returned: row.returned,
    unreturned: row.unreturned,
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader title={t('menus.loanReport')} subtitle={t('loanReports.subtitle')} />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="max-w-xs">
          <FormField icon={CalendarDays} label={t('loanReports.year')} htmlFor="loan-report-year">
            <SearchSelect
              id="loan-report-year"
              value={String(year)}
              placeholder={t('loanReports.selectYear')}
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
              icon={Package}
              tone="bg-teal-50 text-teal-700"
              label={t('loanReports.received')}
              value={formatNumber(received, locale)}
              hint={t('loanReports.fromSuppliers')}
            />
            <KpiCard
              icon={ArrowUpFromLine}
              tone="bg-teal-50 text-teal-600"
              label={t('loanReports.delivered')}
              value={formatNumber(delivered, locale)}
              hint={t('loanReports.percentOfReceived', {
                value: formatNumber(percentOf(delivered, received), locale),
              })}
            />
            <KpiCard
              icon={PackageCheck}
              tone="bg-teal-50 text-teal-700"
              label={t('loanReports.returned')}
              value={formatNumber(returned, locale)}
              hint={t('loanReports.percentOfDelivered', {
                value: formatNumber(percentOf(returned, delivered), locale),
              })}
            />
            <KpiCard
              icon={PackageMinus}
              tone="bg-gold-50 text-gold-600"
              label={t('loanReports.unreturned')}
              value={formatNumber(unreturned, locale)}
              hint={t('loanReports.percentOfDelivered', {
                value: formatNumber(percentOf(unreturned, delivered), locale),
              })}
            />
          </section>

          {received === 0 && delivered === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('loanReports.empty')}
            </p>
          ) : (
            <>
              <section className="grid gap-4 lg:grid-cols-3">
                <article className={`${cardClassName} p-5 lg:col-span-1`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('loanReports.overviewChart')}
                  </h2>
                  <div className="h-72" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overviewBars}
                        margin={{ top: 28, right: 8, left: 0, bottom: 8 }}
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
                        <Bar dataKey="value" name={t('loanReports.count')} radius={[10, 10, 0, 0]} maxBarSize={42}>
                          {overviewBars.map((item) => (
                            <Cell key={item.key} fill={item.fill} />
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
                </article>

                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('loanReports.receivedSplit')}
                  </h2>
                  <div className="relative h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={receivedSplit}
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
                          {receivedSplit.map((item) => (
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
                      <span className="text-2xl font-semibold text-ink-900">
                        {formatNumber(received, locale)}
                      </span>
                      <span className="text-[11px] text-ink-400">{t('loanReports.received')}</span>
                    </div>
                  </div>
                  <ChartLegend items={receivedSplit} total={received} locale={locale} />
                </article>

                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('loanReports.deliveredSplit')}
                  </h2>
                  <div className="relative h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={deliveredSplit}
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
                          {deliveredSplit.map((item) => (
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
                      <span className="text-2xl font-semibold text-ink-900">
                        {formatNumber(delivered, locale)}
                      </span>
                      <span className="text-[11px] text-ink-400">{t('loanReports.delivered')}</span>
                    </div>
                  </div>
                  <ChartLegend items={deliveredSplit} total={delivered} locale={locale} />
                </article>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  icon={Warehouse}
                  tone="bg-cream-100 text-ink-700"
                  label={t('loanReports.warehouse')}
                  value={formatNumber(warehouse, locale)}
                  hint={t('loanReports.warehouseHint')}
                />
                <KpiCard
                  icon={PackageOpen}
                  tone="bg-gold-50 text-gold-600"
                  label={t('loanReports.stillWithManagers')}
                  value={formatNumber(unreturned, locale)}
                  hint={t('loanReports.stillWithManagersHint')}
                />
              </section>

              {itemStock.length > 0 ? (
                <TableCard empty={t('loanReports.empty')} hasRows rowClick={false}>
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 text-ink-700">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.itemName')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.supplier')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.quantity')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.unit')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.deliveredCount')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.returnedCount')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('loanReports.remainingCount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemStock.map((row) => (
                        <tr key={row.itemId} className="border-t border-line">
                          <td className="px-4 py-3">{row.itemName}</td>
                          <td className="px-4 py-3">{row.supplierName}</td>
                          <td className="px-4 py-3">{formatNumber(row.quantity, locale)}</td>
                          <td className="px-4 py-3">{formatItemUnit(row.unit, t)}</td>
                          <td className="px-4 py-3">{formatNumber(row.delivered, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.returned, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.remaining, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-line bg-cream-50 font-medium text-ink-900">
                        <td className="px-4 py-3" colSpan={2}>{t('loanReports.total')}</td>
                        <td className="px-4 py-3">{formatNumber(stockTotals.quantity, locale)}</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3">{formatNumber(stockTotals.delivered, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(stockTotals.returned, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(stockTotals.remaining, locale)}</td>
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
                    <h2 className="text-sm font-medium text-ink-900">{t('loanReports.byItem')}</h2>
                  </div>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={itemBars}
                        layout="vertical"
                        margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
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
                        <Bar dataKey="received" name={t('loanReports.received')} fill={COLORS.received} radius={[0, 10, 10, 0]} maxBarSize={14}>
                          <LabelList dataKey="received" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
                        <Bar dataKey="delivered" name={t('loanReports.delivered')} fill={COLORS.delivered} radius={[0, 10, 10, 0]} maxBarSize={14}>
                          <LabelList dataKey="delivered" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
                        <Bar dataKey="unreturned" name={t('loanReports.unreturned')} fill={COLORS.unreturned} radius={[0, 10, 10, 0]} maxBarSize={14}>
                          <LabelList dataKey="unreturned" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
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
                    <h2 className="text-sm font-medium text-ink-900">{t('loanReports.bySupplier')}</h2>
                  </div>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={supplierBars}
                        layout="vertical"
                        margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
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
                        <Bar dataKey="received" name={t('loanReports.received')} fill={COLORS.received} radius={[0, 10, 10, 0]} maxBarSize={14}>
                          <LabelList dataKey="received" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
                        <Bar dataKey="delivered" name={t('loanReports.delivered')} fill={COLORS.delivered} radius={[0, 10, 10, 0]} maxBarSize={14}>
                          <LabelList dataKey="delivered" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
                        <Bar dataKey="unreturned" name={t('loanReports.unreturned')} fill={COLORS.unreturned} radius={[0, 10, 10, 0]} maxBarSize={14}>
                          <LabelList dataKey="unreturned" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
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
                    <h2 className="text-sm font-medium text-ink-900">{t('loanReports.byManager')}</h2>
                  </div>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={managerBars}
                        layout="vertical"
                        margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
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
                        <Bar dataKey="delivered" name={t('loanReports.delivered')} fill={COLORS.delivered} radius={[0, 10, 10, 0]} maxBarSize={16}>
                          <LabelList dataKey="delivered" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
                        <Bar dataKey="returned" name={t('loanReports.returned')} fill={COLORS.returned} radius={[0, 10, 10, 0]} maxBarSize={16}>
                          <LabelList dataKey="returned" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
                        <Bar dataKey="unreturned" name={t('loanReports.unreturned')} fill={COLORS.unreturned} radius={[0, 10, 10, 0]} maxBarSize={16}>
                          <LabelList dataKey="unreturned" position="right" offset={6} style={chartValueLabel} formatter={(value) => chartValueText(value, locale)} />
                        </Bar>
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
              {t('loanReports.percent', {
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
              {formatNumber(Number(item.value ?? 0), locale)} {t('loanReports.count')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
