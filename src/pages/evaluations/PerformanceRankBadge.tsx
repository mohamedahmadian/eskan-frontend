import { useTranslation } from 'react-i18next'
import {
  formatPerformanceRank,
  performanceRankLabelKey,
  performanceRankTone,
} from '../../lib/evaluations'

const toneClass: Record<string, string> = {
  excellent:
    'border-teal-400 bg-gradient-to-b from-teal-50 to-white text-teal-800 shadow-[0_12px_28px_rgba(46,189,182,0.22)]',
  good: 'border-mint-400 bg-gradient-to-b from-mint-50 to-white text-mint-800 shadow-[0_12px_28px_rgba(63,214,190),0.2)]',
  average:
    'border-ink-400 bg-gradient-to-b from-cream-50 to-white text-ink-800 shadow-[0_10px_22px_rgba(63,58,52,0.1)]',
  weak: 'border-gold-400 bg-gradient-to-b from-gold-50 to-white text-gold-700 shadow-[0_10px_22px_rgba(196,149,58,0.18)]',
  poor: 'border-red-300 bg-gradient-to-b from-red-50 to-white text-red-700 shadow-[0_10px_22px_rgba(185,28,28,0.14)]',
  empty: 'border-line bg-white text-ink-400 shadow-[0_8px_18px_rgba(63,58,52,0.06)]',
}

export function PerformanceRankBadge({
  rank,
}: {
  rank: number | null | undefined
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const hasRank = rank != null && Number.isFinite(rank)
  const tone = hasRank ? performanceRankTone(rank) : 'empty'

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div
        className={`flex size-[6.5rem] flex-col items-center justify-center rounded-full border-[3px] ${toneClass[tone]}`}
        aria-label={t('evaluations.performanceRank')}
      >
        <span className="text-[2rem] font-bold leading-none tracking-tight">
          {hasRank ? formatPerformanceRank(rank, locale) : '—'}
        </span>
        {hasRank ? (
          <span className="mt-1 px-2 text-center text-[11px] font-semibold leading-4">
            {t(performanceRankLabelKey(rank))}
          </span>
        ) : null}
      </div>
      <span className="text-[11px] font-medium text-ink-600">
        {t('evaluations.performanceRank')}
      </span>
    </div>
  )
}
