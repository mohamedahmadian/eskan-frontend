import { useTranslation } from 'react-i18next'
import { useHeadquartersSummary } from '../../hooks/useHeadquartersSummary'
import { formatNumber } from '../../lib/datetime'

export function HeadquartersServiceYearsCard({
  className = 'flex justify-center',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const query = useHeadquartersSummary()

  const years = query.data?.yearsOfService
  const startYear = query.data?.activityStartYear
  const currentYear = query.data?.currentYear
  if (years == null || startYear == null || currentYear == null) {
    return null
  }

  return (
    <div className={className}>
      <section
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-full border border-white/80 bg-gradient-to-b from-white via-teal-50/90 to-mint-50 shadow-[0_10px_28px_rgba(46,189,182,0.22),0_2px_8px_rgba(20,40,40,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-teal-100/80 transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(46,189,182,0.38),0_6px_14px_rgba(63,214,190),0.22),inset_0_1px_0_rgba(255,255,255,1)] hover:ring-teal-200/90 ${
          compact ? 'size-[5.75rem]' : 'size-[7.75rem]'
        }`}
        aria-label={t('dashboard.serviceYears')}
      >
        <div
          className="pointer-events-none absolute inset-1 rounded-full bg-gradient-to-tr from-teal-100/40 via-transparent to-mint-100/50"
          aria-hidden
        />
        <span
          className={`relative rounded-full bg-teal-500 font-semibold leading-none text-white shadow-[0_4px_10px_rgba(46,189,182,0.35)] ${
            compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'
          }`}
        >
          {t('dashboard.serviceYears')}
        </span>
        <p
          className={`relative font-extrabold leading-none tracking-tight text-teal-800 ${
            compact ? 'mt-1.5 text-[1.45rem]' : 'mt-2.5 text-[2rem]'
          }`}
        >
          {formatNumber(years, locale)}
        </p>
        <div className={`relative flex items-center gap-1 ${compact ? 'mt-1' : 'mt-1.5'}`} dir="ltr">
          <span
            className={`rounded-full bg-white/90 font-medium text-teal-700 ring-1 ring-teal-100 ${
              compact ? 'px-1 py-px text-[8px]' : 'px-1.5 py-0.5 text-[9px]'
            }`}
          >
            {formatNumber(startYear, locale)}
          </span>
          <span className={`text-ink-400 ${compact ? 'text-[8px]' : 'text-[9px]'}`} aria-hidden>
            –
          </span>
          <span
            className={`rounded-full bg-white/90 font-medium text-mint-700 ring-1 ring-mint-100 ${
              compact ? 'px-1 py-px text-[8px]' : 'px-1.5 py-0.5 text-[9px]'
            }`}
          >
            {formatNumber(currentYear, locale)}
          </span>
        </div>
      </section>
    </div>
  )
}
