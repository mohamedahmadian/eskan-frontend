import {
  Building,
  CalendarDays,
  ClipboardList,
  Filter,
  HandHeart,
  Hash,
  Landmark,
  Package,
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
import { useAuth } from '../../auth/AuthProvider'
import {
  cardClassName,
  FormField,
  listShellClassName,
  LoadingState,
  PageHeader,
} from '../../components/ui/Form'
import { TableCard } from '../../components/ui/ListControls'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import type {
  GovernmentOrganization,
  SupportRequestReport,
  SupportRequestStatus,
  SupportRequestType,
} from '../../types/app'
import { supportRequestStatuses, supportRequestTypes } from '../../types/app'

const STATUS_COLORS: Record<SupportRequestStatus, string> = {
  PENDING: '#e8b83a',
  IN_PROGRESS: '#2ebdb6',
  FULFILLED: '#148f8a',
  REJECTED: '#c45c4a',
}

const TYPE_COLORS: Record<SupportRequestType, string> = {
  GOODS: '#148f8a',
  PLACE: '#2ebdb6',
  TRANSPORT: '#5ed4ce',
  OTHER: '#7a756c',
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

export function SupportRequestReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const admin = isAdmin(user)
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYear(yearFromUrl, currentYear)
  const fromDate = searchParams.get('fromDate') ?? ''
  const toDate = searchParams.get('toDate') ?? ''
  const type = (searchParams.get('type') ?? '') as SupportRequestType | ''
  const status = (searchParams.get('status') ?? '') as SupportRequestStatus | ''
  const organizationId = searchParams.get('organizationId') ?? ''

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: String(currentYear) })
  }, [currentYear, setParams, yearFromUrl])

  const organizations = useQuery({
    queryKey: ['government-organizations', 'lookup'],
    enabled: admin,
    queryFn: async () => {
      const { data } = await api.get<GovernmentOrganization[]>('/government-organizations')
      return data
    },
  })

  const query = useQuery({
    queryKey: [
      'support-requests',
      'report',
      year,
      fromDate,
      toDate,
      type,
      status,
      organizationId,
    ],
    queryFn: async () => {
      const { data } = await api.get<SupportRequestReport>('/support-requests/report', {
        params: {
          year,
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
          ...(type ? { type } : {}),
          ...(status ? { status } : {}),
          ...(admin && organizationId ? { organizationId } : {}),
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  const total = report?.total ?? 0
  const typeBars = (report?.byType ?? [])
    .filter((row) => row.count > 0)
    .map((row) => ({
      key: row.type,
      name: t(`supportRequests.types.${row.type}`),
      value: row.count,
      fill: TYPE_COLORS[row.type],
    }))
  const statusSlices = (report?.byStatus ?? [])
    .filter((row) => row.count > 0)
    .map((row) => ({
      key: row.status,
      name: t(`supportRequests.statuses.${row.status}`),
      value: row.count,
      fill: STATUS_COLORS[row.status],
    }))
  const orgBars = (report?.byOrganization ?? []).slice(0, 10).map((row) => ({
    name: row.name,
    count: row.count,
    quantity: row.quantity,
  }))
  const monthBars = (report?.byMonth ?? []).map((row) => ({
    name: t(`supportRequestReports.months.${row.month}`),
    count: row.count,
    quantity: row.quantity,
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.supportRequestReport')}
        subtitle={t('supportRequestReports.subtitle')}
      />

      <article className={`${cardClassName} p-4 sm:p-5`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField icon={CalendarDays} label={t('supportRequestReports.year')} htmlFor="support-report-year">
            <SearchSelect
              id="support-report-year"
              value={String(year)}
              placeholder={t('supportRequestReports.selectYear')}
              onChange={(next) => setParams({ year: next || undefined })}
              options={persianYearOptions(locale, year)}
            />
          </FormField>
          <FormField icon={CalendarDays} label={t('supportRequestReports.fromDate')} htmlFor="support-report-from">
            <PersianDateField
              id="support-report-from"
              value={fromDate || undefined}
              onChange={(next) => setParams({ fromDate: next || undefined })}
            />
          </FormField>
          <FormField icon={CalendarDays} label={t('supportRequestReports.toDate')} htmlFor="support-report-to">
            <PersianDateField
              id="support-report-to"
              value={toDate || undefined}
              onChange={(next) => setParams({ toDate: next || undefined })}
            />
          </FormField>
          <FormField icon={Package} label={t('supportRequests.type')} htmlFor="support-report-type">
            <SearchSelect
              id="support-report-type"
              value={type}
              placeholder={t('supportRequests.allTypes')}
              onChange={(next) => setParams({ type: next || undefined })}
              options={[
                { value: '', label: t('supportRequests.allTypes') },
                ...Object.values(supportRequestTypes).map((value) => ({
                  value,
                  label: t(`supportRequests.types.${value}`),
                })),
              ]}
            />
          </FormField>
          <FormField icon={Filter} label={t('supportRequests.status')} htmlFor="support-report-status">
            <SearchSelect
              id="support-report-status"
              value={status}
              placeholder={t('supportRequests.allStatuses')}
              onChange={(next) => setParams({ status: next || undefined })}
              options={[
                { value: '', label: t('supportRequests.allStatuses') },
                ...Object.values(supportRequestStatuses).map((value) => ({
                  value,
                  label: t(`supportRequests.statuses.${value}`),
                })),
              ]}
            />
          </FormField>
          {admin ? (
            <FormField
              icon={Building}
              label={t('supportRequests.organization')}
              htmlFor="support-report-org"
            >
              <SearchSelect
                id="support-report-org"
                value={organizationId}
                placeholder={t('supportRequests.allOrganizations')}
                onChange={(next) => setParams({ organizationId: next || undefined })}
                options={[
                  { value: '', label: t('supportRequests.allOrganizations') },
                  ...(organizations.data ?? []).map((organization) => ({
                    value: organization.id,
                    label: organization.name,
                  })),
                ]}
              />
            </FormField>
          ) : null}
        </div>
      </article>

      {query.isLoading && !report ? (
        <LoadingState />
      ) : query.isError || !report ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      ) : (
        <div className={`space-y-6 ${query.isFetching ? 'opacity-70' : ''}`}>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              icon={HandHeart}
              tone="bg-teal-50 text-teal-700"
              label={t('supportRequestReports.total')}
              value={formatNumber(total, locale)}
              hint={t('supportRequestReports.quantityHint', {
                value: formatNumber(report.quantity, locale),
              })}
            />
            <KpiCard
              icon={ClipboardList}
              tone="bg-gold-50 text-gold-600"
              label={t('supportRequests.statuses.PENDING')}
              value={formatNumber(report.pending, locale)}
              hint={t('supportRequestReports.percentHint', {
                value: formatNumber(percentOf(report.pending, total), locale),
              })}
            />
            <KpiCard
              icon={Filter}
              tone="bg-teal-50 text-teal-600"
              label={t('supportRequests.statuses.IN_PROGRESS')}
              value={formatNumber(report.inProgress, locale)}
              hint={t('supportRequestReports.percentHint', {
                value: formatNumber(percentOf(report.inProgress, total), locale),
              })}
            />
            <KpiCard
              icon={Landmark}
              tone="bg-mint-100 text-mint-700"
              label={t('supportRequests.statuses.FULFILLED')}
              value={formatNumber(report.fulfilled, locale)}
              hint={t('supportRequestReports.percentHint', {
                value: formatNumber(percentOf(report.fulfilled, total), locale),
              })}
            />
            <KpiCard
              icon={Hash}
              tone="bg-red-50 text-red-700"
              label={t('supportRequests.statuses.REJECTED')}
              value={formatNumber(report.rejected, locale)}
              hint={t('supportRequestReports.percentHint', {
                value: formatNumber(percentOf(report.rejected, total), locale),
              })}
            />
          </section>

          {total === 0 ? (
            <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
              {t('supportRequestReports.empty')}
            </p>
          ) : (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('supportRequestReports.byTypeChart')}
                  </h2>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeBars} margin={{ top: 28, right: 8, left: 0, bottom: 8 }} barCategoryGap="28%">
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
                        <Bar dataKey="value" name={t('supportRequestReports.count')} radius={[10, 10, 0, 0]} maxBarSize={42}>
                          {typeBars.map((item) => (
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
                    {t('supportRequestReports.byStatusChart')}
                  </h2>
                  <div className="relative h-72" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 28, bottom: 20, left: 28 }}>
                        <Pie
                          data={statusSlices}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={3}
                          cornerRadius={6}
                          stroke="#ffffff"
                          strokeWidth={3}
                          labelLine={false}
                        >
                          {statusSlices.map((item) => (
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
                        {formatNumber(total, locale)}
                      </span>
                      <span className="text-[11px] text-ink-400">{t('supportRequestReports.total')}</span>
                    </div>
                  </div>
                  <ChartLegend items={statusSlices} total={total} locale={locale} />
                </article>
              </section>

              {monthBars.length > 0 ? (
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('supportRequestReports.byMonthChart')}
                  </h2>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthBars} margin={{ top: 28, right: 8, left: 0, bottom: 8 }} barCategoryGap="28%">
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
                        <Bar
                          dataKey="count"
                          name={t('supportRequestReports.count')}
                          fill="#148f8a"
                          radius={[10, 10, 0, 0]}
                          maxBarSize={42}
                        >
                          <LabelList
                            dataKey="count"
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
              ) : null}

              {orgBars.length > 0 ? (
                <article className={`${cardClassName} p-5`}>
                  <h2 className="mb-4 text-sm font-medium text-ink-500">
                    {t('supportRequestReports.byOrganizationChart')}
                  </h2>
                  <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={orgBars}
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
                          width={128}
                          tick={chartAxisTick}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: '#eefaf9' }} content={<ReportTooltip />} />
                        <Bar
                          dataKey="count"
                          name={t('supportRequestReports.count')}
                          fill="#2ebdb6"
                          radius={[0, 10, 10, 0]}
                          maxBarSize={22}
                        >
                          <LabelList
                            dataKey="count"
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
              ) : null}

              <TableCard empty={t('supportRequestReports.empty')} hasRows={report.byOrganization.length > 0} rowClick={false}>
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequests.organization')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequestReports.count')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequests.quantity')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequests.statuses.PENDING')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequests.statuses.IN_PROGRESS')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequests.statuses.FULFILLED')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('supportRequests.statuses.REJECTED')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byOrganization.map((row) => (
                      <tr key={row.id} className="border-t border-line">
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{formatNumber(row.count, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(row.quantity, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(row.pending, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(row.inProgress, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(row.fulfilled, locale)}</td>
                        <td className="px-4 py-3">{formatNumber(row.rejected, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-cream-50 font-medium">
                      <td className="px-4 py-3">{t('supportRequestReports.total')}</td>
                      <td className="px-4 py-3">{formatNumber(report.total, locale)}</td>
                      <td className="px-4 py-3">{formatNumber(report.quantity, locale)}</td>
                      <td className="px-4 py-3">{formatNumber(report.pending, locale)}</td>
                      <td className="px-4 py-3">{formatNumber(report.inProgress, locale)}</td>
                      <td className="px-4 py-3">{formatNumber(report.fulfilled, locale)}</td>
                      <td className="px-4 py-3">{formatNumber(report.rejected, locale)}</td>
                    </tr>
                  </tfoot>
                </table>
              </TableCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <TableCard empty={t('supportRequestReports.empty')} hasRows rowClick={false}>
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 text-ink-700">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">{t('supportRequests.type')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('supportRequestReports.count')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('supportRequests.quantity')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byType.map((row) => (
                        <tr key={row.type} className="border-t border-line">
                          <td className="px-4 py-3">{t(`supportRequests.types.${row.type}`)}</td>
                          <td className="px-4 py-3">{formatNumber(row.count, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.quantity, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
                <TableCard empty={t('supportRequestReports.empty')} hasRows rowClick={false}>
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 text-ink-700">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">{t('supportRequests.status')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('supportRequestReports.count')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('supportRequests.quantity')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byStatus.map((row) => (
                        <tr key={row.status} className="border-t border-line">
                          <td className="px-4 py-3">{t(`supportRequests.statuses.${row.status}`)}</td>
                          <td className="px-4 py-3">{formatNumber(row.count, locale)}</td>
                          <td className="px-4 py-3">{formatNumber(row.quantity, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
              </div>
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
              {t('supportRequestReports.percent', {
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
              {formatNumber(Number(item.value ?? 0), locale)} {t('supportRequestReports.count')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
