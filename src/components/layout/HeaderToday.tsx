import { CalendarDays } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatGregorianDate,
  formatHijriDate,
  formatJalaliDate,
  formatJalaliMonthName,
  formatWeekday,
  todayIsoDate,
} from '../../lib/datetime'

function useTodayIso() {
  const [iso, setIso] = useState(todayIsoDate)

  useEffect(() => {
    let timeoutId = 0
    function schedule() {
      const now = new Date()
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      )
      timeoutId = window.setTimeout(() => {
        setIso(todayIsoDate())
        schedule()
      }, Math.max(1000, nextMidnight.getTime() - now.getTime()))
    }
    schedule()
    return () => window.clearTimeout(timeoutId)
  }, [])

  return iso
}

function CalendarCol({
  label,
  value,
  dir,
  lang,
  className = '',
}: {
  label: string
  value: string
  dir?: 'ltr' | 'rtl'
  lang?: string
  className?: string
}) {
  if (!value) return null
  return (
    <span
      className={`flex min-w-0 flex-col gap-0.5 px-2.5 sm:px-3 ${className}`}
    >
      <span className="text-[10px] font-medium leading-none text-teal-700">{label}</span>
      <span
        className="truncate text-sm font-semibold leading-tight text-ink-900"
        dir={dir}
        lang={lang}
        title={value}
      >
        {value}
      </span>
    </span>
  )
}

function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <span
      className={`grid transition-[grid-template-columns,opacity] duration-300 ease-out motion-reduce:transition-none ${
        open ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'
      }`}
      aria-hidden={!open}
    >
      <span className="flex min-w-0 items-stretch overflow-hidden whitespace-nowrap">
        {children}
      </span>
    </span>
  )
}

export function HeaderToday() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const iso = useTodayIso()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const weekday = formatWeekday(iso, locale)
  const jalali = formatJalaliDate(iso, locale)
  const jalaliMonth = formatJalaliMonthName(iso, locale)
  const hijri = formatHijriDate(iso, locale)
  const gregorian = formatGregorianDate(iso, locale)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-label={`${t('nav.todayCalendars')} — ${
        open ? t('nav.hideAllCalendars') : t('nav.showAllCalendars')
      }`}
      title={open ? t('nav.hideAllCalendars') : t('nav.showAllCalendars')}
      className={`flex max-w-[min(100%,22rem)] shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-2xl border bg-white py-1.5 pe-2 ps-1.5 text-start shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-teal-300 sm:max-w-none sm:gap-2.5 sm:py-2 sm:pe-3 sm:ps-2 ${
        open
          ? 'border-teal-300 shadow-[0_8px_20px_rgba(46,189,182,0.16)]'
          : 'border-line'
      }`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-mint-500 text-white shadow-[0_6px_12px_rgba(46,189,182,0.28)]">
        <CalendarDays className="size-4" aria-hidden />
      </span>
      <time dateTime={iso} className="flex min-w-0 items-stretch">
        {weekday ? (
          <Reveal open={open}>
            <span className="flex min-w-0 flex-col justify-center pe-2.5 sm:pe-3">
              <span className="text-[10px] font-medium leading-none text-ink-400">
                {t('common.today')}
              </span>
              <span className="mt-0.5 truncate text-xs font-semibold leading-tight text-teal-800">
                {weekday}
              </span>
            </span>
          </Reveal>
        ) : null}
        <span
          className={`flex min-w-0 flex-col items-center justify-center px-1 text-center sm:px-1.5 ${
            open ? 'border-s border-line ps-2.5 sm:ps-3' : ''
          }`}
        >
          <span className="text-sm font-semibold leading-tight text-ink-900" dir="ltr">
            {jalali}
          </span>
          {jalaliMonth ? (
            <span className="mt-0.5 text-[11px] font-medium leading-none text-teal-700">
              {jalaliMonth}
            </span>
          ) : null}
        </span>
        <Reveal open={open}>
          <CalendarCol
            className="border-s border-line"
            label={t('common.calendarHijri')}
            value={hijri}
            dir="rtl"
            lang="ar"
          />
          <CalendarCol
            className="border-s border-line"
            label={t('common.calendarGregorian')}
            value={gregorian}
            dir="ltr"
          />
        </Reveal>
      </time>
    </button>
  )
}
