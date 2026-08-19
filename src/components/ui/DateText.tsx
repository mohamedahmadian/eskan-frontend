import { useTranslation } from 'react-i18next'
import { formatDate, formatDateTime } from '../../lib/datetime'

export function DateText({
  value,
  withTime,
}: {
  value?: string | null
  withTime?: boolean
}) {
  const { i18n } = useTranslation()
  if (!value) {
    return '—'
  }
  const locale = i18n.language.split('-')[0] ?? 'fa'
  return withTime ? formatDateTime(value, locale) : formatDate(value, locale)
}
