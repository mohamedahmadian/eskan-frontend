import { Copy, IdCard, Smartphone, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { useCopyDigits } from '../../components/ui/CopyableDigits'
import { localizeDigits, toLatinDigits } from '../../lib/datetime'

function IdentityBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const copyDigits = useCopyDigits()
  const displayed = localizeDigits(value, locale)

  return (
    <button
      type="button"
      title={t('common.copy')}
      aria-label={`${t('common.copy')} ${label} ${displayed}`}
      onClick={() => copyDigits(value)}
      className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-50 py-1.5 ps-1.5 pe-3 text-sm text-ink-700 ring-1 ring-teal-100 transition hover:bg-teal-100 hover:ring-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 shadow-[0_2px_6px_rgba(20,40,40,0.06)]">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="text-xs text-ink-500">{label}</span>
      <span dir="ltr" className="font-semibold text-ink-900">
        {displayed}
      </span>
      <Copy className="size-3.5 text-teal-500 opacity-60 transition group-hover:opacity-100" aria-hidden />
    </button>
  )
}

export function WelcomeIdentityBadges() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const nationalId = user?.nationalId ? toLatinDigits(user.nationalId).trim() : ''
  const phone = user?.phone ? toLatinDigits(user.phone).trim() : ''
  if (!nationalId && !phone) return null

  return (
    <div className="ms-auto flex shrink-0 flex-col items-end gap-2">
      {nationalId ? (
        <IdentityBadge icon={IdCard} label={t('dashboard.myNationalId')} value={nationalId} />
      ) : null}
      {phone ? (
        <IdentityBadge icon={Smartphone} label={t('dashboard.myPhone')} value={phone} />
      ) : null}
    </div>
  )
}
