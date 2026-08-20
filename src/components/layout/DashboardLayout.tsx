import { Menu, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getNavIcon } from '../../lib/icons'
import { getPageMeta } from '../../lib/page-meta'
import { PageTransition } from '../ui/PageTransition'
import { UserMenu } from './UserMenu'

export function DashboardLayout() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const mainRef = useRef<HTMLElement>(null)
  const meta = getPageMeta(location.pathname)

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname, location.search])

  const modules = useMemo(() => {
    const needle = query.trim()
    if (!needle) return user?.modules ?? []
    return (user?.modules ?? [])
      .map((mod) => ({
        ...mod,
        menus: mod.menus.filter(
          (item) =>
            t(item.nameKey).includes(needle) || t(mod.nameKey).includes(needle),
        ),
      }))
      .filter((mod) => mod.menus.length > 0)
  }, [query, t, user?.modules])

  return (
    <div className="h-svh overflow-hidden bg-cream-50">
      <div className="flex h-full">
        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-ink-900/20 lg:hidden"
            aria-label={t('nav.closeMenu')}
            onClick={() => setOpen(false)}
          />
        ) : null}
        <aside
          className={`fixed inset-y-0 start-0 z-40 flex h-svh w-[280px] flex-col border-e border-line bg-white transition lg:static lg:h-full lg:translate-x-0 ${
            open
              ? 'translate-x-0'
              : 'ltr:-translate-x-full rtl:translate-x-full lg:ltr:translate-x-0 lg:rtl:translate-x-0'
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white">
              ا
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{t('nav.panel')}</p>
              <p className="truncate text-xs text-ink-400">{t('app.name')}</p>
            </div>
            <button
              type="button"
              className="ms-auto rounded-lg p-2 text-ink-500 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label={t('nav.closeMenu')}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="px-4 pb-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('nav.searchMenu')}
                className="w-full rounded-2xl border border-line bg-cream-50 py-2.5 ps-10 pe-3 text-sm placeholder:text-ink-400"
              />
            </label>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
            {modules.map((mod) => (
              <div key={mod.code}>
                <p className="mb-1 px-3 text-[11px] font-medium text-ink-400">
                  {t(mod.nameKey)}
                </p>
                <div className="space-y-1">
                  {mod.menus.map((item) => {
                    const Icon = getNavIcon(item.icon)
                    return (
                      <NavLink
                        key={item.code}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                            isActive
                              ? 'bg-teal-500 text-white shadow-sm'
                              : 'text-ink-700 hover:bg-cream-50'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={`size-4 ${isActive ? 'text-white' : 'text-ink-400'}`}
                              aria-hidden
                            />
                            {t(item.nameKey)}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-20 flex shrink-0 items-center gap-3 bg-cream-50/90 px-4 py-4 backdrop-blur sm:px-8">
            <button
              type="button"
              className="rounded-xl p-2 text-ink-700 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t('nav.openMenu')}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-ink-900">
                {t(meta.titleKey)}
              </h1>
              {meta.subtitleKey ? (
                <p className="truncate text-xs text-ink-400">{t(meta.subtitleKey)}</p>
              ) : null}
            </div>
            <UserMenu />
          </header>
          <main
            ref={mainRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-8"
          >
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  )
}
