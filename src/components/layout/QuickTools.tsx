import { Plus, ScanSearch, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ReceptionDesk } from '../../pages/reception/ReceptionDesk'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import { Button, cardClassName, cancelPendingFormEnter } from '../ui/Form'
import { QuickToolsContext } from './quick-tools-context'

const DOUBLE_ENTER_MS = 500

function isReceptionPath(pathname: string) {
  return pathname === '/reception' || pathname.startsWith('/reception/')
}

export function QuickToolsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const enabled = hasMenuAccess('/reception', user?.modules ?? [])
  const onReceptionPage = isReceptionPath(pathname)
  const focusFnRef = useRef<(() => void) | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const registerFocus = useCallback((fn: () => void) => {
    focusFnRef.current = fn
    return () => {
      if (focusFnRef.current === fn) focusFnRef.current = null
    }
  }, [])

  const openSearch = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    setSearchOpen(true)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!enabled) return
    let lastAt = 0
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.repeat || event.isComposing) return
      const target = event.target as HTMLElement | null
      if (target?.closest('textarea, [contenteditable="true"]')) return

      const now = Date.now()
      if (now - lastAt >= DOUBLE_ENTER_MS) {
        lastAt = now
        return
      }

      event.preventDefault()
      event.stopPropagation()
      lastAt = 0
      cancelPendingFormEnter()
      if (onReceptionPage || searchOpen) {
        focusFnRef.current?.()
        return
      }
      setMenuOpen(false)
      setSearchOpen(true)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [enabled, onReceptionPage, searchOpen])

  const value = useMemo(() => ({ registerFocus }), [registerFocus])

  return (
    <QuickToolsContext.Provider value={value}>
      {children}
      {enabled ? (
        <QuickToolsFab
          menuOpen={menuOpen}
          searchOpen={searchOpen}
          hidden={onReceptionPage || searchOpen}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          onCloseMenu={() => setMenuOpen(false)}
          onOpenSearch={openSearch}
        />
      ) : null}
      {enabled && searchOpen ? (
        <ReceptionSearchModal onClose={() => setSearchOpen(false)} />
      ) : null}
    </QuickToolsContext.Provider>
  )
}

function QuickToolsFab({
  menuOpen,
  searchOpen,
  hidden,
  onToggleMenu,
  onCloseMenu,
  onOpenSearch,
}: {
  menuOpen: boolean
  searchOpen: boolean
  hidden: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpenSearch: () => void
}) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onCloseMenu()
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMenu()
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, onCloseMenu])

  if (hidden) return null

  return (
    <div
      ref={rootRef}
      data-quick-tools
      className="pointer-events-none fixed bottom-5 end-5 z-[25] flex flex-col items-end gap-2 print:hidden"
    >
      {menuOpen ? (
        <div
          role="menu"
          className="pointer-events-auto w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(20,40,40,0.14)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-ink-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300"
            onClick={onOpenSearch}
          >
            <ScanSearch className="size-4 shrink-0 text-teal-600" aria-hidden />
            <span className="min-w-0">
              <span className="block font-medium">{t('quickTools.searchInfo')}</span>
              <span className="mt-0.5 block text-xs text-ink-400">{t('quickTools.searchInfoHint')}</span>
            </span>
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="pointer-events-auto flex size-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)] transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        aria-label={menuOpen ? t('quickTools.close') : t('quickTools.open')}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={onToggleMenu}
      >
        <Plus
          className={`size-6 transition ${menuOpen || searchOpen ? 'rotate-45' : ''}`}
          aria-hidden
        />
      </button>
    </div>
  )
}

function ReceptionSearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented) return
      if (document.querySelector('[data-nested-dialog]')) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-tools-search-title"
        className={`relative z-10 flex w-full flex-col overflow-hidden ${cardClassName} ${
          expanded
            ? 'max-h-[min(88vh,44rem)] max-w-4xl'
            : 'max-w-lg'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2
            id="quick-tools-search-title"
            className="min-w-0 text-sm font-semibold leading-6 text-ink-900"
          >
            {t('quickTools.searchInfoTitle')}
          </h2>
          <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('common.close')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className={`min-h-0 p-3 sm:p-4 ${expanded ? 'flex-1 overflow-y-auto' : ''}`}>
          <ReceptionDesk variant="modal" onExpandedChange={setExpanded} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
