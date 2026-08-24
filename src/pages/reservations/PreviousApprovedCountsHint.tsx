import { History, Mars, Users, Venus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { PreviousApprovedCounts } from '../../types/app'

export function PreviousApprovedCountsHint({ reservationId }: { reservationId: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)

  const query = useQuery({
    queryKey: ['reservations', reservationId, 'previous-approved-counts'],
    queryFn: async () => {
      const { data } = await api.get<PreviousApprovedCounts>(
        `/reservations/${reservationId}/previous-approved-counts`,
      )
      return data
    },
  })

  if (query.isLoading || query.isError) return null

  const previous = query.data?.previous
  if (!previous) {
    return (
      <aside className="flex items-start gap-3 rounded-2xl border border-dashed border-teal-200 bg-gradient-to-l from-mint-50/80 via-white to-teal-50/90 px-4 py-3.5 shadow-[0_8px_20px_rgba(46,189,182,0.08)]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
          <History className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold leading-6 text-ink-800">
            {t('reservations.previousApprovedEmpty')}
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="space-y-2.5 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-4 py-3.5 shadow-[0_8px_20px_rgba(46,189,182,0.1)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
          <History className="size-3.5" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-ink-900">{t('reservations.previousApprovedTitle')}</p>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
          {t('reservations.previousApprovedYear', { year: n(previous.year) })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <PreviousCountChip
          icon={Mars}
          label={t('reservations.male')}
          value={n(previous.maleCount)}
          tone="teal"
        />
        <PreviousCountChip
          icon={Venus}
          label={t('reservations.female')}
          value={n(previous.femaleCount)}
          tone="mint"
        />
        <PreviousCountChip
          icon={Users}
          label={t('reservations.totalCount')}
          value={n(previous.totalCount)}
          tone="ink"
        />
      </div>
    </aside>
  )
}

function PreviousCountChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: string
  tone: 'teal' | 'mint' | 'ink'
}) {
  const wrap =
    tone === 'teal'
      ? 'border-teal-100 bg-white'
      : tone === 'mint'
        ? 'border-mint-100 bg-white'
        : 'border-line bg-white'
  const iconWrap =
    tone === 'teal'
      ? 'bg-teal-500 text-white'
      : tone === 'mint'
        ? 'bg-mint-500 text-white'
        : 'bg-ink-700 text-white'
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center ${wrap}`}>
      <span className={`flex size-7 items-center justify-center rounded-lg ${iconWrap}`}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <p className="text-[10px] font-medium text-ink-500">{label}</p>
      <p className="text-sm font-bold text-ink-900">{value}</p>
    </div>
  )
}
