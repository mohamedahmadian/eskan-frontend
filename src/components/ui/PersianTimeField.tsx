import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { SearchSelect } from './SearchSelect'

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function splitTime(value: string) {
  const match = /^(\d{2}):(\d{2})/.exec(value)
  return {
    hour: match?.[1] ?? '08',
    minute: match?.[2] ?? '00',
  }
}

export function PersianTimeField({
  id,
  value,
  onChange,
  required,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { hour, minute } = splitTime(value)

  const hours = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => {
        const next = pad2(index)
        return { value: next, label: localizeDigits(next, locale) }
      }),
    [locale],
  )
  const minutes = useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => {
        const next = pad2(index)
        return { value: next, label: localizeDigits(next, locale) }
      }),
    [locale],
  )

  return (
    <>
      <label className="sr-only" htmlFor={id ? `${id}-minute` : undefined}>
        {t('honoraryServants.minute')}
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2" dir="ltr">
        <SearchSelect
          id={id}
          value={hour}
          required={required}
          options={hours}
          placeholder={t('honoraryServants.hour')}
          onChange={(next) => onChange(`${next}:${minute}`)}
        />
        <span className="text-base font-semibold text-ink-500" aria-hidden>
          :
        </span>
        <SearchSelect
          id={id ? `${id}-minute` : undefined}
          value={minute}
          required={required}
          options={minutes}
          placeholder={t('honoraryServants.minute')}
          onChange={(next) => onChange(`${hour}:${next}`)}
        />
      </div>
    </>
  )
}
