import { LogIn, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { AppLogo } from '../../components/brand/AppLogo'
import { AdminFooter } from '../../components/layout/AdminFooter'
import { LocaleSwitcher } from '../../components/layout/LocaleSwitcher'
import { useBrandDisplay } from '../../hooks/useHeadquartersSummary'

export function LandingShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { title: brandTitle, name: brandName, logoSrc, branding } = useBrandDisplay()

  return (
    <div className="landing-root flex min-h-svh flex-col bg-cream-50">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link to="/welcome" className="flex min-w-0 items-center gap-3">
            <AppLogo
              src={logoSrc}
              className={
                logoSrc
                  ? 'h-11 w-11 shrink-0 rounded-2xl bg-white object-cover shadow-[0_8px_18px_rgba(20,40,40,0.16)] ring-1 ring-teal-100 sm:h-12 sm:w-12'
                  : 'h-11 w-auto shrink-0 object-contain sm:h-12'
              }
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900 sm:text-base">{brandTitle}</p>
              {brandName && brandName !== brandTitle ? (
                <p className="truncate text-[11px] text-ink-400 sm:text-xs">{brandName}</p>
              ) : null}
            </div>
          </Link>
          <div className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <LocaleSwitcher />
            {user ? (
              <Link
                to="/"
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <LogIn className="size-4" aria-hidden />
                {t('landing.goToPanel')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <LogIn className="size-4" aria-hidden />
                  {t('landing.login')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <UserPlus className="size-4" aria-hidden />
                  {t('landing.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <AdminFooter branding={branding} />
    </div>
  )
}
