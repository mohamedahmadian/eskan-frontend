import { type LucideIcon } from 'lucide-react'
import { type ReactNode, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDateTimeDate, formatTime } from '../../lib/datetime'

export const VoucherTicket = forwardRef<
  HTMLDivElement,
  {
    title: string
    code: string
    codeLabel: string
    issuedAt?: string | null
    issuedWithTime?: boolean
    qrUrl: string | null
    children: ReactNode
    footer?: ReactNode
  }
>(function VoucherTicket(
  { title, code, codeLabel, issuedAt, issuedWithTime = true, qrUrl, children, footer },
  ref,
) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-[28px] border border-teal-100 bg-white shadow-[0_18px_40px_rgba(15,110,106,0.08)]"
    >
      <div className="relative bg-teal-500 px-6 py-5 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={headerPattern} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-teal-50">{t('app.name')}</p>
            <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 text-center">
            <p className="text-[11px] text-teal-50">{codeLabel}</p>
            <p className="font-semibold tracking-[0.18em] text-white" dir="ltr">
              {code}
            </p>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gold-400" />
      {issuedAt ? (
        <div className="flex items-end justify-between gap-4 bg-cream-50 px-6 py-3" dir="ltr">
          <div className="text-start">
            <p className="text-[11px] text-ink-400">{t('common.date')}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink-900">
              {issuedWithTime ? formatDateTimeDate(issuedAt, locale) : formatDate(issuedAt, locale)}
            </p>
          </div>
          {issuedWithTime ? (
            <div className="text-end">
              <p className="text-[11px] text-ink-400">{t('common.time')}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-900">{formatTime(issuedAt, locale)}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-6 p-6 sm:grid-cols-[168px_minmax(0,1fr)] sm:items-start">
        <div className="mx-auto w-[168px]">
          <div className="flex size-[168px] items-center justify-center rounded-[28px] border border-dashed border-teal-200 bg-cream-50 p-3">
            <div className="flex size-full items-center justify-center rounded-2xl bg-white p-2 shadow-[0_8px_20px_rgba(20,40,40,0.06)]">
              {qrUrl ? (
                <img src={qrUrl} alt={code} className="size-full object-contain" />
              ) : (
                <span className="text-xs text-ink-400">{t('common.loading')}</span>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-400">{t('publicVouchers.scanHint')}</p>
        </div>
        <div className="grid gap-3">{children}</div>
      </div>
      {footer}
    </div>
  )
})

const headerPattern = {
  backgroundImage:
    'repeating-linear-gradient(-18deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)',
}

export function VoucherFact({
  icon: Icon,
  label,
  value,
  dir,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  dir?: 'ltr' | 'rtl'
  accent?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl px-3.5 py-3 ${
        accent ? 'bg-teal-50' : 'bg-cream-50'
      }`}
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
          accent ? 'bg-white text-teal-700' : 'bg-white text-teal-600'
        }`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] ${accent ? 'text-teal-700' : 'text-ink-400'}`}>{label}</p>
        <div
          className={`mt-0.5 text-sm font-semibold ${accent ? 'text-teal-900' : 'text-ink-900'}`}
          dir={dir}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

export function VoucherFooter({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-line bg-cream-50 px-6 py-4">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-teal-600">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-ink-900">{value}</p>
      </div>
    </div>
  )
}
