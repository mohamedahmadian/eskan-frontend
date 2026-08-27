import { useTranslation } from 'react-i18next'
import { formatDate, formatDateTimeDate, formatHijriDate, formatTime } from '../../lib/datetime'

export function DateText({
  value,
  withTime,
  stacked,
}: {
  value?: string | null
  withTime?: boolean
  stacked?: boolean
}) {
  const { i18n } = useTranslation()
  if (!value) {
    return '—'
  }
  const locale = i18n.language.split('-')[0] ?? 'fa'
  if (!withTime) {
    return formatDate(value, locale)
  }
  return (
    <span
      className={
        stacked
          ? 'flex flex-col items-start gap-0.5'
          : 'inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-0.5'
      }
      dir="ltr"
    >
      <span>{formatDateTimeDate(value, locale)}</span>
      <span>{formatTime(value, locale)}</span>
    </span>
  )
}

export function HijriDateText({ value }: { value?: string | null }) {
  const { i18n } = useTranslation()
  if (!value) return null
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const text = formatHijriDate(value, locale)
  if (!text) return null
  return (
    <p className="text-xs leading-6 text-ink-500" dir="rtl" lang="ar">
      {text}
    </p>
  )
}
