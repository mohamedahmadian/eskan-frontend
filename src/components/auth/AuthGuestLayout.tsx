import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useBrandDisplay } from '../../hooks/useHeadquartersSummary'
import { AppLogo } from '../brand/AppLogo'
import { cardClassName } from '../ui/Form'

export function AuthGuestLayout({
  title,
  subtitle,
  backTo,
  children,
}: {
  title: string
  subtitle?: string
  backTo?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const { title: brandTitle, logoSrc } = useBrandDisplay()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh items-center justify-center bg-cream-50 px-4 py-8">
      <div className={`relative w-full max-w-md p-8 ${cardClassName}`}>
        <AppLogo src={logoSrc} className="mx-auto mb-4 h-16 w-auto object-contain" />
        <p className="text-center text-2xl font-semibold text-ink-900">{brandTitle}</p>
        <p className="mt-2 text-center text-sm text-ink-500">{t('app.tagline')}</p>
        <div className="mt-8 flex items-center gap-2">
          {backTo ? (
            <button
              type="button"
              aria-label={t('common.back')}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl text-teal-700 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              onClick={() => navigate(backTo)}
            >
              <ArrowRight className="size-5 ltr:rotate-180" aria-hidden />
            </button>
          ) : null}
          <h1 className="text-lg font-medium text-ink-900">{title}</h1>
        </div>
        {subtitle ? (
          <p className={`mt-1 text-sm text-ink-500 ${backTo ? 'ps-11' : ''}`}>{subtitle}</p>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function AuthNotice({
  icon: Icon,
  tone = 'teal',
  children,
}: {
  icon: LucideIcon
  tone?: 'teal' | 'mint' | 'warn'
  children: ReactNode
}) {
  const toneClass =
    tone === 'mint'
      ? 'border-mint-100 bg-gradient-to-b from-mint-50 to-white text-ink-800'
      : tone === 'warn'
        ? 'border-amber-100 bg-gradient-to-b from-amber-50 to-white text-ink-800'
        : 'border-teal-100 bg-gradient-to-b from-teal-50 to-white text-ink-800'
  const iconClass =
    tone === 'mint'
      ? 'bg-mint-500 text-white'
      : tone === 'warn'
        ? 'bg-amber-500 text-white'
        : 'bg-teal-500 text-white'

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm leading-7 ${toneClass}`}>
      <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 pt-1">{children}</div>
    </div>
  )
}
