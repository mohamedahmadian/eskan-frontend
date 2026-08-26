import {
  Building2,
  MapPin,
  Tent,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { api } from '../../lib/api'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { ProvincialMonitoringCounts } from '../../types/app'

export const chartAxisTick = { fill: '#7a756c', fontSize: 12 }
export const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

export const MONITOR_CHART_COLORS = [
  '#148f8a',
  '#2ebdb6',
  '#5ed4ce',
  '#e8b83a',
  '#f5cd6a',
  '#7a756c',
  '#3d9b96',
  '#c9a227',
]

export function chartValueText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatGroupedNumber(n, locale) : ''
}

export function parseMonitorYear(raw: string | null, fallback: number) {
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 1300 || year > 1600) return fallback
  return year
}

export function yearQuery(year: number) {
  return `year=${year}`
}

export function heatColor(value: number, max: number) {
  if (max <= 0 || value <= 0) return '#f3eee6'
  const t = Math.min(1, value / max)
  if (t < 0.33) return '#c8efe9'
  if (t < 0.66) return '#7ed9d1'
  return '#2ebdb6'
}

function MonitorBarTooltip({
  active,
  payload,
  label,
  seriesName,
  unitLabel,
  locale,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string | number
  seriesName: string
  unitLabel: string
  locale: string
}) {
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
              {seriesName}
            </span>
            <span className="font-semibold text-ink-900">
              {formatGroupedNumber(Number(item.value ?? 0), locale)} {unitLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function VerticalMonitorBarChart({
  data,
  locale,
  seriesName,
  unitLabel,
  onItemClick,
}: {
  data: { key?: string; name: string; value: number }[]
  locale: string
  seriesName: string
  unitLabel: string
  onItemClick?: (item: { key: string; name: string }) => void
}) {
  const rows = data.filter((row) => row.value > 0)
  if (rows.length === 0) return null
  const chartWidth = Math.max(360, rows.length * 56)
  const height = Math.max(280, rows.length * 28)

  return (
    <div className="overflow-x-auto" dir="ltr">
      <div style={{ width: chartWidth, height }} className="min-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 28, right: 8, left: 0, bottom: 48 }}
            barCategoryGap="28%"
          >
            <CartesianGrid stroke="#eceae3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={rows.length > 6 ? -35 : 0}
              textAnchor={rows.length > 6 ? 'end' : 'middle'}
              height={rows.length > 6 ? 70 : 40}
            />
            <YAxis
              allowDecimals={false}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(value: number) => formatGroupedNumber(value, locale)}
            />
            <Tooltip
              cursor={{ fill: '#eefaf9' }}
              content={
                <MonitorBarTooltip
                  seriesName={seriesName}
                  unitLabel={unitLabel}
                  locale={locale}
                />
              }
            />
            <Bar
              dataKey="value"
              name={seriesName}
              radius={[10, 10, 0, 0]}
              maxBarSize={42}
              cursor={onItemClick ? 'pointer' : undefined}
              onClick={(item) => {
                if (!onItemClick) return
                const source =
                  item && typeof item === 'object' && 'payload' in item
                    ? (item as { payload?: { key?: string; name?: string } }).payload
                    : item
                const key = typeof source?.key === 'string' ? source.key : undefined
                const name = typeof source?.name === 'string' ? source.name : undefined
                if (key && name) onItemClick({ key, name })
              }}
            >
              {rows.map((item, index) => (
                <Cell
                  key={`${item.key ?? item.name}-${index}`}
                  fill={MONITOR_CHART_COLORS[index % MONITOR_CHART_COLORS.length]}
                />
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
    </div>
  )
}

export async function downloadMonitoringExcel(path: string, filename: string) {
  const { data } = await api.get<Blob>(path, { responseType: 'blob' })
  const blob = data instanceof Blob ? data : new Blob([data])
  if (blob.type.includes('json')) {
    const text = await blob.text()
    const parsed = JSON.parse(text) as { message?: string }
    throw new Error(parsed.message || 'error')
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function MonitoringStatTiles({
  totals,
}: {
  totals: ProvincialMonitoringCounts
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const items: { icon: LucideIcon; label: string; value: number; tone: 'teal' | 'mint' | 'ink' }[] = [
    {
      icon: Users,
      label: t('provincialMonitoring.reservationPilgrims'),
      value: totals.reservationPilgrims.total,
      tone: 'teal',
    },
    {
      icon: Tent,
      label: t('provincialMonitoring.caravans'),
      value: totals.caravanCount,
      tone: 'mint',
    },
    {
      icon: Building2,
      label: t('provincialMonitoring.activeCaravans'),
      value: totals.activeCaravanCount,
      tone: 'teal',
    },
    {
      icon: UsersRound,
      label: t('provincialMonitoring.groups'),
      value: totals.groupCount,
      tone: 'mint',
    },
    {
      icon: Users,
      label: t('provincialMonitoring.capacity'),
      value: totals.caravanCapacity.total,
      tone: 'ink',
    },
    {
      icon: MapPin,
      label: t('provincialMonitoring.residentPilgrims'),
      value: totals.residentPilgrims,
      tone: 'ink',
    },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
      {items.map((item) => (
        <FormFactTile
          key={item.label}
          icon={item.icon}
          label={item.label}
          tone={item.tone}
          value={formatNumber(item.value, locale)}
        />
      ))}
    </div>
  )
}

export function MonitoringBarChart({
  title,
  icon: Icon,
  data,
  onItemClick,
}: {
  title: string
  icon: LucideIcon
  data: { id?: string; name: string; pilgrims: number }[]
  onItemClick?: (item: { key: string; name: string }) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const rows = data
    .filter((row) => row.pilgrims > 0)
    .map((row) => ({
      key: row.id,
      name: row.name,
      value: row.pilgrims,
    }))
  if (rows.length === 0) return null
  return (
    <section>
      <FormSectionTitle icon={Icon}>{title}</FormSectionTitle>
      <div className="mt-3">
        <VerticalMonitorBarChart
          data={rows}
          locale={locale}
          seriesName={t('provincialMonitoring.reservationPilgrims')}
          unitLabel={t('provincialMonitoring.count')}
          onItemClick={onItemClick}
        />
      </div>
    </section>
  )
}
