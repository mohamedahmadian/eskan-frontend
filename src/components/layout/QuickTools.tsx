import { FileSearch, LocateFixed, ScanSearch, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ReceptionDesk } from '../../pages/reception/ReceptionDesk'
import { ReservationFileSearchModal } from '../../pages/reservations/ReservationFileSearchModal'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import { Button, cardClassName, cancelPendingFormEnter } from '../ui/Form'
import { QuickToolsContext } from './quick-tools-context'

const DOUBLE_ENTER_MS = 500

function isReceptionPath(pathname: string) {
  return pathname === '/reception' || pathname.startsWith('/reception/')
}

function isLocationPath(pathname: string) {
  return pathname === '/my-location' || pathname.startsWith('/my-location/')
}

export function QuickToolsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const canReception = hasMenuAccess('/reception', user?.modules ?? [])
  const canLocation = hasMenuAccess('/my-location', user?.modules ?? [])
  const canFileSearch =
    hasMenuAccess('/reservations', user?.modules ?? []) ||
    hasMenuAccess('/my-reservations', user?.modules ?? []) ||
    canReception
  const onReceptionPage = isReceptionPath(pathname)
  const onLocationPage = isLocationPath(pathname)
  const showSearch = canReception && !onReceptionPage
  const showFileSearch = canFileSearch
  const showLocation = canLocation && !onLocationPage
  const fabEnabled = showSearch || showFileSearch || showLocation
  const focusFnRef = useRef<(() => void) | null>(null)
  const fileFocusFnRef = useRef<(() => void) | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [fileSearchOpen, setFileSearchOpen] = useState(false)

  const registerFocus = useCallback((fn: () => void) => {
    focusFnRef.current = fn
    return () => {
      if (focusFnRef.current === fn) focusFnRef.current = null
    }
  }, [])

  const registerFileFocus = useCallback((fn: () => void) => {
    fileFocusFnRef.current = fn
    return () => {
      if (fileFocusFnRef.current === fn) fileFocusFnRef.current = null
    }
  }, [])

  const openSearch = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    setFileSearchOpen(false)
    setSearchOpen(true)
  }, [])

  const openFileSearch = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    setSearchOpen(false)
    setFileSearchOpen(true)
  }, [])

  const openLocation = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    navigate('/my-location')
  }, [navigate])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setFileSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!canReception) return
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
  }, [canReception, onReceptionPage, searchOpen])

  useEffect(() => {
    if (!canFileSearch) return
    let lastAt = 0
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.isComposing) return
      if (event.code !== 'NumpadAdd' && !(event.key === '+' && event.location === 3)) {
        return
      }
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
      if (fileSearchOpen) {
        fileFocusFnRef.current?.()
        return
      }
      setMenuOpen(false)
      setSearchOpen(false)
      setFileSearchOpen(true)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [canFileSearch, fileSearchOpen])

  const value = useMemo(
    () => ({ registerFocus, registerFileFocus }),
    [registerFocus, registerFileFocus],
  )

  return (
    <QuickToolsContext.Provider value={value}>
      {children}
      {fabEnabled ? (
        <QuickToolsFab
          menuOpen={menuOpen}
          searchOpen={searchOpen}
          hidden={searchOpen || fileSearchOpen}
          showSearch={showSearch}
          showFileSearch={showFileSearch}
          showLocation={showLocation}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          onCloseMenu={() => setMenuOpen(false)}
          onOpenSearch={openSearch}
          onOpenFileSearch={openFileSearch}
          onOpenLocation={openLocation}
        />
      ) : null}
      {canReception && searchOpen ? (
        <ReceptionSearchModal onClose={() => setSearchOpen(false)} />
      ) : null}
      {fileSearchOpen ? (
        <ReservationFileSearchModal onClose={() => setFileSearchOpen(false)} />
      ) : null}
    </QuickToolsContext.Provider>
  )
}

function QuickToolsFab({
  menuOpen,
  searchOpen,
  hidden,
  showSearch,
  showFileSearch,
  showLocation,
  onToggleMenu,
  onCloseMenu,
  onOpenSearch,
  onOpenFileSearch,
  onOpenLocation,
}: {
  menuOpen: boolean
  searchOpen: boolean
  hidden: boolean
  showSearch: boolean
  showFileSearch: boolean
  showLocation: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpenSearch: () => void
  onOpenFileSearch: () => void
  onOpenLocation: () => void
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
      className="pointer-events-none fixed bottom-10 end-10 z-[25] flex flex-col items-end gap-2 sm:bottom-12 sm:end-12 print:hidden"
    >
      {menuOpen ? (
        <div
          role="menu"
          className="pointer-events-auto w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(20,40,40,0.14)]"
        >
          {showSearch ? (
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
          ) : null}
          {showFileSearch ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-ink-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300"
              onClick={onOpenFileSearch}
            >
              <FileSearch className="size-4 shrink-0 text-teal-600" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">{t('quickTools.searchFile')}</span>
                <span className="mt-0.5 block text-xs text-ink-400">{t('quickTools.searchFileHint')}</span>
              </span>
            </button>
          ) : null}
          {showLocation ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-ink-800 transition hover:bg-mint-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-300"
              onClick={onOpenLocation}
            >
              <LocateFixed className="size-4 shrink-0 text-mint-600" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">{t('quickTools.myLocation')}</span>
                <span className="mt-0.5 block text-xs text-ink-400">{t('quickTools.myLocationHint')}</span>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        className="pointer-events-auto relative size-16 overflow-hidden rounded-full bg-white shadow-[0_10px_22px_rgba(20,40,40,0.16)] ring-2 ring-white transition hover:ring-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:size-[4.5rem]"
        aria-label={menuOpen ? t('quickTools.close') : t('quickTools.open')}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={onToggleMenu}
      >
        <img
          src="/smalllogo.png"
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
        {menuOpen || searchOpen ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ink-900/45">
            <X className="size-6 text-white" aria-hidden />
          </span>
        ) : null}
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
