import { Boxes, Menu, PackageOpen, Search, Snowflake, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getNavIcon } from '../../lib/icons'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import { getPageMeta } from '../../lib/page-meta'
import { canAccessMyCaravans, canAccessMyGroups, usesDedicatedHomeDashboard } from '../../lib/roles'
import type { NavMenu, NavModule } from '../../types/app'
import { PageTransition } from '../ui/PageTransition'
import { UserMenu } from './UserMenu'

const menuSections: Record<string, { titleKey: string; icon?: typeof Snowflake; codes: string[] }[]> = {
  logistics: [
    {
      titleKey: 'menus.loanItemsSection',
      icon: PackageOpen,
      codes: ['logistics.loans', 'logistics.loan-report', 'logistics.my-loans'],
    },
    {
      titleKey: 'menus.quotaItemsSection',
      icon: Boxes,
      codes: [
        'logistics.item-quotas',
        'logistics.issue-voucher',
        'logistics.vouchers',
        'logistics.voucher-report',
        'logistics.my-vouchers',
      ],
    },
    {
      titleKey: 'menus.iceVouchersSection',
      icon: Snowflake,
      codes: [
        'logistics.ice-vouchers',
        'logistics.ice-voucher-report',
        'logistics.my-ice-vouchers',
        'logistics.settings',
      ],
    },
  ],
}

function splitMenus(mod: NavModule) {
  const sections = menuSections[mod.code] ?? []
  const groupedCodes = new Set(sections.flatMap((section) => section.codes))
  return {
    ungrouped: mod.menus.filter((item) => !groupedCodes.has(item.code)),
    sections: sections
      .map((section) => ({
        ...section,
        items: section.codes
          .map((code) => mod.menus.find((item) => item.code === code))
          .filter((item): item is NavMenu => Boolean(item)),
      }))
      .filter((section) => section.items.length > 0),
  }
}

function menuMatchesSearch(mod: NavModule, item: NavMenu, needle: string, label: (key: string) => string) {
  if (label(item.nameKey).includes(needle) || label(mod.nameKey).includes(needle)) {
    return true
  }
  return (menuSections[mod.code] ?? []).some(
    (section) => section.codes.includes(item.code) && label(section.titleKey).includes(needle),
  )
}

export function DashboardLayout() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const mainRef = useRef<HTMLElement>(null)
  const meta = getPageMeta(location.pathname)
  const subtitleKey =
    (location.pathname === '/' || location.pathname === '') && usesDedicatedHomeDashboard(user)
      ? 'dashboard.userSubtitle'
      : meta.subtitleKey

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  const modules = useMemo(() => {
    const showMyCaravans = canAccessMyCaravans(user)
    const showMyGroups = canAccessMyGroups(user)
    const visible = (user?.modules ?? [])
      .map((mod) => ({
        ...mod,
        menus: mod.menus.filter(
          (item) =>
            (item.code !== 'caravans.mine' || showMyCaravans) &&
            (item.code !== 'groups.mine' || showMyGroups),
        ),
      }))
      .filter((mod) => mod.menus.length > 0)
    const needle = query.trim()
    if (!needle) return visible
    return visible
      .map((mod) => ({
        ...mod,
        menus: mod.menus.filter((item) => menuMatchesSearch(mod, item, needle, t)),
      }))
      .filter((mod) => mod.menus.length > 0)
  }, [query, t, user])

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
            {modules.map((mod) => {
              const { ungrouped, sections } = splitMenus(mod)
              return (
                <div key={mod.code}>
                  <p className="mb-1 px-3 text-[11px] font-medium text-ink-400">
                    {t(mod.nameKey)}
                  </p>
                  <div className="space-y-1">
                    {ungrouped.map((item) => (
                      <SidebarMenuLink key={item.code} item={item} onNavigate={() => setOpen(false)} />
                    ))}
                  </div>
                  {sections.map((section) => {
                    const SectionIcon = section.icon
                    return (
                      <div key={section.titleKey} className="mt-3">
                        <p className="mb-1 flex items-center gap-1.5 px-3 text-[11px] font-medium text-teal-700">
                          {SectionIcon ? <SectionIcon className="size-3.5" aria-hidden /> : null}
                          {t(section.titleKey)}
                        </p>
                        <div className="ms-3 space-y-1 border-s border-teal-100 ps-2">
                          {section.items.map((item) => (
                            <SidebarMenuLink
                              key={item.code}
                              item={item}
                              onNavigate={() => setOpen(false)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
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
                {t(meta.titleKey, { year: formatNumber(currentPersianYear(), locale) })}
              </h1>
              {subtitleKey ? (
                <p className="truncate text-xs text-ink-400">{t(subtitleKey)}</p>
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

function SidebarMenuLink({
  item,
  onNavigate,
}: {
  item: NavMenu
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const Icon = getNavIcon(item.icon)
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
          isActive ? 'bg-teal-500 text-white shadow-sm' : 'text-ink-700 hover:bg-cream-50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`size-4 ${isActive ? 'text-white' : 'text-ink-400'}`} aria-hidden />
          {t(item.nameKey)}
        </>
      )}
    </NavLink>
  )
}

