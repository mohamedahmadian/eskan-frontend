import { CalendarDays, Milestone, type LucideIcon } from 'lucide-react'
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
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { currentPersianYear, formatDate, formatNumber, persianYearOptions } from '../../lib/datetime'
import type { StationReport } from '../../types/app'

const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }
const colors = ['#2ebdb6', '#3fd6be', '#e8b83a', '#7a756c', '#148f8a', '#f5cd6a']

function chartValueText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatNumber(n, locale) : ''
}

function parseYear(raw: string | null, fallback: number) {
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

function StatBox({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'teal' | 'mint' | 'ink' | 'rose'
}) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    mint: 'bg-mint-50 text-mint-700',
    ink: 'bg-cream-100 text-ink-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <article className={`${cardClassName} flex items-center gap-3 p-4`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-ink-900">{value}</p>
      </div>
    </article>
  )
}

export function StationReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseYear(yearFromUrl, currentYear)
  const stationId = searchParams.get('stationId') ?? ''

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: String(currentYear) })
  }, [currentYear, setParams, yearFromUrl])

  const query = useQuery({
    queryKey: ['walking-stations', 'report', year, stationId],
    queryFn: async () => {
      const { data } = await api.get<StationReport>('/walking-stations/report', {
        params: { year, ...(stationId ? { stationId } : {}) },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  const report = query.data
  if (!report) {
    return <LoadingState />
  }

  const dayData = report.byDay.map((row) => ({
    name: formatDate(row.date, locale),
    total: row.total,
    present: row.present,
    absent: row.absent,
  }))
  const monthData = report.byMonth.map((row) => ({
    name: t(`stationReport.months.${row.month}`),
    total: row.total,
    present: row.present,
    absent: row.absent,
  }))
  const mealData = report.byMeal.map((row) => ({
    name: t(`reservations.stationMeals.${row.mealType}`),
    value: row.count,
  }))
  const typeData = report.byType.map((row) => ({
    name: t(`reservations.types.${row.type}`),
    value: row.count,
  }))

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader title={t('stationReport.title')} subtitle={t('stationReport.subtitle')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={Milestone} label={t('stationReport.station')} htmlFor="report-station">
          <SearchSelect
            id="report-station"
            value={stationId}
            placeholder={t('stationReport.allStations')}
            onChange={(next) => setParams({ stationId: next || undefined })}
            options={[
              { value: '', label: t('stationReport.allStations') },
              ...report.stations.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </FormField>
        <FormField icon={CalendarDays} label={t('stationReport.year')} htmlFor="report-year">
          <SearchSelect
            id="report-year"
            value={String(year)}
            placeholder={t('stationReport.year')}
            onChange={(next) => setParams({ year: next || String(currentYear) })}
            options={persianYearOptions(locale, year)}
          />
        </FormField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          icon={Milestone}
          label={t('stationReport.totalStays')}
          value={formatNumber(report.totals.stays, locale)}
          tone="teal"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.present')}
          value={formatNumber(report.totals.present, locale)}
          tone="mint"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.absent')}
          value={formatNumber(report.totals.absent, locale)}
          tone="rose"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.reservations')}
          value={formatNumber(report.totals.reservations, locale)}
          tone="ink"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.reserved')}
          value={formatNumber(report.totals.reserved, locale)}
          tone="teal"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.cancelled')}
          value={formatNumber(report.totals.cancelled, locale)}
          tone="ink"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.male')}
          value={formatNumber(report.totals.male, locale)}
          tone="mint"
        />
        <StatBox
          icon={Milestone}
          label={t('stationReport.female')}
          value={formatNumber(report.totals.female, locale)}
          tone="teal"
        />
      </div>

      {!report.totals.stays ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-ink-500">
          {t('stationReport.empty')}
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${cardClassName} p-4`}>
            <h3 className="mb-3 text-sm font-medium text-ink-700">{t('stationReport.byDay')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dayData} margin={{ top: 28, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" />
                <XAxis dataKey="name" tick={chartAxisTick} />
                <YAxis tick={chartAxisTick} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="present" fill="#2ebdb6" radius={[8, 8, 0, 0]}>
                  <LabelList
                    dataKey="present"
                    position="top"
                    offset={6}
                    style={chartValueLabel}
                    formatter={(value) => chartValueText(value, locale)}
                  />
                </Bar>
                <Bar dataKey="absent" fill="#f5a3a3" radius={[8, 8, 0, 0]}>
                  <LabelList
                    dataKey="absent"
                    position="top"
                    offset={6}
                    style={chartValueLabel}
                    formatter={(value) => chartValueText(value, locale)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className={`${cardClassName} p-4`}>
            <h3 className="mb-3 text-sm font-medium text-ink-700">{t('stationReport.byMonth')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData} margin={{ top: 28, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" />
                <XAxis dataKey="name" tick={chartAxisTick} />
                <YAxis tick={chartAxisTick} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#3fd6be" radius={[8, 8, 0, 0]}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    offset={6}
                    style={chartValueLabel}
                    formatter={(value) => chartValueText(value, locale)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className={`${cardClassName} p-4`}>
            <h3 className="mb-3 text-sm font-medium text-ink-700">{t('stationReport.byMeal')}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
                <Pie
                  data={mealData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  labelLine={false}
                >
                  {mealData.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="outside"
                    style={chartValueLabel}
                    formatter={(value) => chartValueText(value, locale)}
                  />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
          <section className={`${cardClassName} p-4`}>
            <h3 className="mb-3 text-sm font-medium text-ink-700">{t('stationReport.byType')}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  labelLine={false}
                >
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="outside"
                    style={chartValueLabel}
                    formatter={(value) => chartValueText(value, locale)}
                  />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </div>
  )
}
