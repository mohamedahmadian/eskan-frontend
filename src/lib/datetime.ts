import { DateObject } from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import persian from 'react-date-object/calendars/persian'

export const numberingDigits: Record<string, string[]> = {
  fa: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
  ar: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  ur: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function localizeDigits(input: string, locale: string) {
  const digits = numberingDigits[locale] ?? numberingDigits.en
  return input.replace(/\d/g, (digit) => digits[Number(digit)] ?? digit)
}

export function toLatinDigits(input: string) {
  return input.replace(/[۰-۹٠-٩०-९]/g, (digit) => {
    const fa = numberingDigits.fa.indexOf(digit)
    if (fa >= 0) return String(fa)
    const ar = numberingDigits.ar.indexOf(digit)
    if (ar >= 0) return String(ar)
    const hi = numberingDigits.hi.indexOf(digit)
    if (hi >= 0) return String(hi)
    return digit
  })
}

function toGregorianDateObject(value: string, dateOnly: boolean) {
  const normalized = toLatinDigits(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized)
  if (dateOnly && match) {
    return new DateObject({
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      calendar: gregorian,
    })
  }
  return new DateObject(new Date(normalized))
}

function toDisplayDate(value: string, locale: string, dateOnly: boolean) {
  const calendar = locale === 'fa' ? persian : gregorian
  return toGregorianDateObject(value, dateOnly).convert(calendar)
}

export function formatDate(value: string, locale: string) {
  const date = toDisplayDate(value, locale, true)
  return localizeDigits(
    `${date.year}/${date.month.number}/${date.day}`,
    locale,
  )
}

export function formatDateTimeDate(value: string, locale: string) {
  const date = toDisplayDate(value, locale, false)
  return localizeDigits(
    `${date.year}/${pad2(date.month.number)}/${pad2(date.day)}`,
    locale,
  )
}

export function formatTime(value: string, locale: string) {
  const time = new Date(value)
  return localizeDigits(
    `${pad2(time.getHours())}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`,
    locale,
  )
}

export function formatDateTime(value: string, locale: string) {
  return `${formatDateTimeDate(value, locale)} ${formatTime(value, locale)}`
}

export function formatNumber(value: number, locale: string) {
  return localizeDigits(String(value), locale)
}

export function parseDigitString(input: string) {
  return toLatinDigits(input).replace(/\D/g, '')
}

export function formatGroupedNumber(value: number, locale: string) {
  if (!Number.isFinite(value)) {
    return ''
  }
  const grouped = Math.trunc(value).toLocaleString('en-US').replace(/,/g, '٬')
  return localizeDigits(grouped, locale)
}

export function currentPersianYear() {
  return new DateObject({ calendar: persian }).year
}

export function persianYearOptions(locale: string, selected?: number) {
  const current = currentPersianYear()
  const max = Math.max(current + 1, selected ?? current)
  const min = Math.min(current - 10, selected ?? current)
  const options = []
  for (let year = max; year >= min; year -= 1) {
    options.push({ value: String(year), label: formatNumber(year, locale) })
  }
  return options
}

export function fromIsoDateOnly(value?: string) {
  if (!value) return undefined
  return toGregorianDateObject(value, true)
}

export function toIsoDateOnly(date: DateObject) {
  const gregorianDate = new DateObject({
    year: date.year,
    month: date.month.number,
    day: date.day,
    calendar: date.calendar,
  }).convert(gregorian)
  return `${gregorianDate.year}-${pad2(gregorianDate.month.number)}-${pad2(gregorianDate.day)}`
}
