import {
  BadgeCheck,
  Building2,
  Mars,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cardClassName, listShellClassName, LoadingState, PageHeader } from '../../components/ui/Form'
import { formatNumber } from '../../lib/datetime'
import { api } from '../../lib/api'
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
  MALE: '#c4a35a',
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
  NON_SELF_SUFFICIENT: '#d4b44a',
}

const managementTone: Record<ManagementType, string> = {
  SELF_SUFFICIENT: 'bg-teal-50 text-teal-700',
  SEMI_SELF_SUFFICIENT: 'bg-teal-50 text-teal-600',
  NON_SELF_SUFFICIENT: 'bg-gold-50 text-gold-600',
}

function percentOf(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

export function AccommodationReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  const query = useQuery({
    queryKey: ['accommodations', 'report'],
    queryFn: async () => {
      const { data } = await api.get<AccommodationReport>('/accommodations/report')
      return data
    },
  })

  if (query.isLoading) {
    return (
      <div className={listShellClassName}>
        <PageHeader
          title={t('menus.accommodationReport')}
          subtitle={t('accommodations.reportSubtitle')}
        />
        <LoadingState />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className={listShellClassName}>
        <PageHeader
          title={t('menus.accommodationReport')}
          subtitle={t('accommodations.reportSubtitle')}
        />
        <p className={`${cardClassName} px-5 py-4 text-sm text-red-700`}>{t('common.error')}</p>
      </div>
    )
  }

  const report = query.data
  const genderCounts = Object.fromEntries(
    report.byGenderType.map((row) => [row.genderType, row.count]),
  ) as Record<GenderType, number>
  const managementCounts = Object.fromEntries(
    report.byManagementType.map((row) => [row.managementType, row.count]),
  ) as Record<ManagementType, number>
  const comboCounts = Object.fromEntries(
    report.byCombination.map((row) => [
      `${row.genderType}:${row.managementType}`,
      row.count,
    ]),
  ) as Record<string, number>

  return (
    <div className={`${listShellClassName} space-y-8`}>
      <PageHeader
        title={t('menus.accommodationReport')}
        subtitle={t('accommodations.reportSubtitle')}
      />

      <article className={`${cardClassName} flex items-center gap-4 p-5`}>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Building2 className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm text-ink-500">{t('accommodations.reportTotal')}</p>
          <p className="mt-1 text-3xl font-semibold text-ink-900">
            {formatNumber(report.total, locale)}
          </p>
        </div>
      </article>

      {report.total === 0 ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
          {t('accommodations.reportEmpty')}
        </p>
      ) : (
        <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className={`${cardClassName} p-5`}>
          <h2 className="mb-4 text-sm font-medium text-ink-500">
            {t('accommodations.reportByGenderType')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
            <div className="space-y-3">
              {genderOrder.map((genderType) => (
                <StatRow
                  key={genderType}
                  icon={genderIcon[genderType]}
                  tone={genderTone[genderType]}
                  label={t(`genderTypes.${genderType}`)}
                  value={formatNumber(genderCounts[genderType] ?? 0, locale)}
                  percentLabel={t('accommodations.reportPercent', {
                    value: formatNumber(percentOf(genderCounts[genderType] ?? 0, report.total), locale),
                  })}
                  barColor={genderColors[genderType]}
                  percent={percentOf(genderCounts[genderType] ?? 0, report.total)}
                />
              ))}
            </div>
            <DonutChart
              slices={genderOrder.map((genderType) => ({
                key: genderType,
                value: genderCounts[genderType] ?? 0,
                color: genderColors[genderType],
                label: t(`genderTypes.${genderType}`),
              }))}
              centerValue={formatNumber(report.total, locale)}
              centerLabel={t('accommodations.reportTotal')}
            />
          </div>
        </article>

        <article className={`${cardClassName} p-5`}>
          <h2 className="mb-4 text-sm font-medium text-ink-500">
            {t('accommodations.reportByManagementType')}
          </h2>
          <div className="space-y-3">
            {managementOrder.map((managementType) => (
              <StatRow
                key={managementType}
                icon={BadgeCheck}
                tone={managementTone[managementType]}
                label={t(`managementTypes.${managementType}`)}
                value={formatNumber(managementCounts[managementType] ?? 0, locale)}
                percentLabel={t('accommodations.reportPercent', {
                  value: formatNumber(
                    percentOf(managementCounts[managementType] ?? 0, report.total),
                    locale,
                  ),
                })}
                barColor={managementColors[managementType]}
                percent={percentOf(managementCounts[managementType] ?? 0, report.total)}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink-500">
          {t('accommodations.reportByCombination')}
        </h2>
        <article className={`${cardClassName} p-5`}>
          <GroupedBarChart
            groups={genderOrder.map((genderType) => ({
              key: genderType,
              label: t(`genderTypes.${genderType}`),
              bars: managementOrder.map((managementType) => ({
                key: managementType,
                value: comboCounts[`${genderType}:${managementType}`] ?? 0,
                color: managementColors[managementType],
                label: t(`managementTypes.${managementType}`),
              })),
            }))}
            formatValue={(value) => formatNumber(value, locale)}
          />
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ink-500">
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
        </div>
      )}
    </div>
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

function StatRow({
  icon: Icon,
  tone,
  label,
  value,
  percentLabel,
  barColor,
  percent,
}: {
  icon: LucideIcon
  tone: string
  label: string
  value: string
  percentLabel: string
  barColor: string
  percent: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm text-ink-700">{label}</p>
          <p className="text-base font-semibold text-ink-900">{value}</p>
        </div>
        <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-cream-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${percent}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="mt-1 text-[11px] text-ink-400">{percentLabel}</p>
      </div>
    </div>
  )
}

function DonutChart({
  slices,
  centerValue,
  centerLabel,
}: {
  slices: { key: string; value: number; color: string; label: string }[]
  centerValue: string
  centerLabel: string
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const arcs = slices.map((slice, index) => {
    const length = total > 0 ? (slice.value / total) * circumference : 0
    const offset = slices
      .slice(0, index)
      .reduce((sum, item) => sum + (total > 0 ? (item.value / total) * circumference : 0), 0)
    return { ...slice, length, offset }
  })

  return (
    <div className="relative mx-auto size-[180px]">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={centerLabel}>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#efeee8"
          strokeWidth="14"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth="14"
            strokeDasharray={`${arc.length} ${circumference}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          >
            <title>{`${arc.label}: ${arc.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-ink-900">{centerValue}</span>
      </div>
    </div>
  )
}

function GroupedBarChart({
  groups,
  formatValue,
}: {
  groups: {
    key: string
    label: string
    bars: { key: string; value: number; color: string; label: string }[]
  }[]
  formatValue: (value: number) => string
}) {
  const max = Math.max(1, ...groups.flatMap((group) => group.bars.map((bar) => bar.value)))

  return (
    <div className="flex h-56 items-end justify-around gap-4">
      {groups.map((group) => (
        <div key={group.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-44 w-full items-end justify-center gap-1.5">
            {group.bars.map((bar) => (
              <div key={bar.key} className="flex h-full w-6 flex-col items-center justify-end gap-1">
                <span className="text-[11px] text-ink-500">{formatValue(bar.value)}</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${(bar.value / max) * 100}%`,
                    backgroundColor: bar.color,
                    minHeight: bar.value > 0 ? 6 : 0,
                  }}
                  title={`${bar.label}: ${bar.value}`}
                />
              </div>
            ))}
          </div>
          <span className="text-xs font-medium text-ink-700">{group.label}</span>
        </div>
      ))}
    </div>
  )
}
