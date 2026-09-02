import { useTranslation } from 'react-i18next'
import { languages, type AppLanguage } from '../../i18n'
import { usePreferredLocale } from '../../hooks/usePreferredLocale'

export function LocaleSwitcher({
  tone = 'light',
}: {
  tone?: 'light' | 'onDark'
}) {
  const { t } = useTranslation()
  const { locale, setLocale } = usePreferredLocale()
  const selectedClass =
    tone === 'onDark'
      ? 'bg-white text-teal-800 shadow-sm'
      : 'bg-teal-500 text-white shadow-sm'
  const idleClass =
    tone === 'onDark'
      ? 'bg-white/10 text-white/85 ring-1 ring-white/20 hover:bg-white/18'
      : 'bg-cream-50 text-ink-600 ring-1 ring-line hover:bg-teal-50 hover:text-teal-800'

  return (
    <div
      role="group"
      aria-label={t('settings.locale')}
      className="flex max-w-[min(100%,20rem)] flex-wrap justify-end gap-1"
    >
      {(Object.keys(languages) as AppLanguage[]).map((code) => {
        const selected = locale === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => setLocale(code)}
            className={`rounded-full px-2 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:px-2.5 ${
              selected ? selectedClass : idleClass
            }`}
          >
            {t(`languages.${code}`)}
          </button>
        )
      })}
    </div>
  )
}
