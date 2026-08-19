import DatePickerImport, { DateObject } from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fromIsoDateOnly, numberingDigits, toIsoDateOnly } from '../../lib/datetime'
import { fieldClassName } from './Form'
import 'react-multi-date-picker/styles/colors/teal.css'
import 'react-multi-date-picker/styles/layouts/mobile.css'

const DatePicker =
  (DatePickerImport as unknown as { default?: typeof DatePickerImport }).default ??
  DatePickerImport

export function PersianDateField({
  id,
  value,
  onChange,
}: {
  id?: string
  value?: string
  onChange: (isoDate?: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const dir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
  const selected = value
    ? fromIsoDateOnly(value)?.convert(persian)
    : undefined

  return (
    <DatePicker
      value={selected}
      calendar={persian}
      locale={persian_fa}
      format="YYYY/M/D"
      digits={locale === 'en' ? undefined : (numberingDigits[locale] ?? numberingDigits.fa)}
      className="teal"
      calendarPosition={dir === 'rtl' ? 'bottom-right' : 'bottom-left'}
      containerClassName="w-full"
      portal
      zIndex={80}
      hideOnScroll
      onOpenPickNewDate={false}
      render={(formatted, openCalendar) => (
        <button
          type="button"
          id={id}
          className={`${fieldClassName} flex items-center justify-between gap-2 text-start`}
          onClick={openCalendar}
        >
          <span className={formatted ? 'text-ink-900' : 'text-ink-400'}>
            {formatted || t('common.selectDate')}
          </span>
          <CalendarDays className="size-4 shrink-0 text-teal-600" aria-hidden />
        </button>
      )}
      onChange={(date: DateObject | DateObject[] | null) => {
        if (!date || Array.isArray(date)) {
          onChange(undefined)
          return
        }
        onChange(toIsoDateOnly(date))
      }}
    />
  )
}
