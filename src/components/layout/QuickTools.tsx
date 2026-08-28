import { ClipboardList, FileSearch, LayoutDashboard, LocateFixed, Plus, ScanSearch, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import { canAccessMyReservations, isPilgrim } from '../../lib/roles'
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

type QuickToolsUser = {
  roles?: { code: string }[]
  modules?: { menus: { path: string }[] }[]
} | null | undefined

function getQuickToolsFlags(pathname: string, user: QuickToolsUser) {
  const list = user?.modules ?? []
  const pilgrim = isPilgrim(user)
  const canReception = hasMenuAccess('/reception', list)
  const canLocation = hasMenuAccess('/my-location', list)
  const canMyReservations =
    canAccessMyReservations(user) && hasMenuAccess('/my-reservations', list)
  const showDashboard = pilgrim
  const showNewFile = pilgrim && canMyReservations
  const showMyReservations = pilgrim && canMyReservations
  const showSearch = !pilgrim && canReception && !isReceptionPath(pathname)
  const showFileSearch =
    !pilgrim &&
    (hasMenuAccess('/reservations', list) ||
      hasMenuAccess('/my-reservations', list) ||
      canReception)
  const showLocation = canLocation && (pilgrim || !isLocationPath(pathname))
    return {
    pilgrim,
    canReception,
    canFileSearch: showFileSearch,
    showDashboard,
    showNewFile,
    showMyReservations,
    showSearch,
    showFileSearch,
    showLocation,
    fabEnabled:
      showDashboard ||
      showNewFile ||
      showMyReservations ||
      showSearch ||
      showFileSearch ||
      showLocation,
  }
}

export function isQuickToolsFabVisible(pathname: string, user: QuickToolsUser) {
  return getQuickToolsFlags(pathname, user).fabEnabled
}

const FAB_POS_KEY = 'eskan.quickToolsFab.pos'
const FAB_DESKTOP_QUERY = '(min-width: 1024px)'
const FAB_SIZE_MOBILE = 64
const FAB_SIZE_DESKTOP = 72
const FAB_EDGE = 8
const FAB_DESKTOP_MARGIN = 48
const FAB_DRAG_THRESHOLD = 8

type FabPos = { left: number; bottom: number }

function isDesktopViewport() {
  return window.matchMedia(FAB_DESKTOP_QUERY).matches
}

function fabSizeFor(desktop: boolean) {
  return desktop ? FAB_SIZE_DESKTOP : FAB_SIZE_MOBILE
}

function clampFabPos(pos: FabPos, desktop: boolean): FabPos {
  const size = fabSizeFor(desktop)
  const maxLeft = Math.max(FAB_EDGE, window.innerWidth - size - FAB_EDGE)
  const maxBottom = Math.max(FAB_EDGE, window.innerHeight - size - FAB_EDGE)
  return {
    left: Math.min(maxLeft, Math.max(FAB_EDGE, pos.left)),
    bottom: Math.min(maxBottom, Math.max(FAB_EDGE, pos.bottom)),
  }
}

function defaultFabPos(desktop: boolean): FabPos {
  const size = fabSizeFor(desktop)
  if (!desktop) {
    const dock =
      document.querySelector<HTMLElement>('[data-app-version]') ??
      document.querySelector<HTMLElement>('[data-admin-footer]')
    if (dock) {
      const rect = dock.getBoundingClientRect()
      return {
        left: Math.round(rect.left + rect.width / 2 - size / 2),
        bottom: Math.round(window.innerHeight - (rect.top + rect.height / 2) - size / 2),
      }
    }
    return {
      left: Math.round((window.innerWidth - size) / 2),
      bottom: FAB_EDGE,
    }
  }
  const rtl = document.documentElement.dir === 'rtl'
  return {
    left: rtl ? FAB_DESKTOP_MARGIN : window.innerWidth - size - FAB_DESKTOP_MARGIN,
    bottom: FAB_DESKTOP_MARGIN,
  }
}

function readSavedFabMap(): { desktop?: FabPos; mobile?: FabPos } {
  try {
    const raw = localStorage.getItem(FAB_POS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { left?: unknown; bottom?: unknown; desktop?: FabPos; mobile?: FabPos }
    if (typeof parsed.left === 'number' && typeof parsed.bottom === 'number') {
      return { desktop: { left: parsed.left, bottom: parsed.bottom } }
    }
    const desktop =
      parsed.desktop &&
      typeof parsed.desktop.left === 'number' &&
      typeof parsed.desktop.bottom === 'number'
        ? parsed.desktop
        : undefined
    const mobile =
      parsed.mobile &&
      typeof parsed.mobile.left === 'number' &&
      typeof parsed.mobile.bottom === 'number'
        ? parsed.mobile
        : undefined
    return { desktop, mobile }
  } catch {
    return {}
  }
}

function writeSavedFabPos(pos: FabPos, desktop: boolean) {
  const current = readSavedFabMap()
  localStorage.setItem(
    FAB_POS_KEY,
    JSON.stringify(desktop ? { ...current, desktop: pos } : { ...current, mobile: pos }),
  )
}

export function QuickToolsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const {
    canReception,
    canFileSearch,
    showDashboard,
    showNewFile,
    showMyReservations,
    showSearch,
    showFileSearch,
    showLocation,
    fabEnabled,
  } = getQuickToolsFlags(pathname, user)
  const onReceptionPage = isReceptionPath(pathname)
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

  const openDashboard = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    navigate('/')
  }, [navigate])

  const openNewFile = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    navigate('/my-reservations/new')
  }, [navigate])

  const openMyReservations = useCallback(() => {
    cancelPendingFormEnter()
    setMenuOpen(false)
    navigate('/my-reservations')
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
          showDashboard={showDashboard}
          showNewFile={showNewFile}
          showMyReservations={showMyReservations}
          showSearch={showSearch}
          showFileSearch={showFileSearch}
          showLocation={showLocation}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          onCloseMenu={() => setMenuOpen(false)}
          onOpenDashboard={openDashboard}
          onOpenNewFile={openNewFile}
          onOpenMyReservations={openMyReservations}
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
  showDashboard,
  showNewFile,
  showMyReservations,
  showSearch,
  showFileSearch,
  showLocation,
  onToggleMenu,
  onCloseMenu,
  onOpenDashboard,
  onOpenNewFile,
  onOpenMyReservations,
  onOpenSearch,
  onOpenFileSearch,
  onOpenLocation,
}: {
  menuOpen: boolean
  searchOpen: boolean
  hidden: boolean
  showDashboard: boolean
  showNewFile: boolean
  showMyReservations: boolean
  showSearch: boolean
  showFileSearch: boolean
  showLocation: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpenDashboard: () => void
  onOpenNewFile: () => void
  onOpenMyReservations: () => void
  onOpenSearch: () => void
  onOpenFileSearch: () => void
  onOpenLocation: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const newFileYear = formatNumber(currentPersianYear(), locale)
  const rootRef = useRef<HTMLDivElement>(null)
  const posRef = useRef<FabPos>({ left: 0, bottom: 0 })
  const skipClickRef = useRef(false)
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    originLeft: number
    originBottom: number
    dragging: boolean
  } | null>(null)
  const [desktop, setDesktop] = useState(() =>
    typeof window === 'undefined' ? true : isDesktopViewport(),
  )
  const [pos, setPos] = useState<FabPos>(() => {
    if (typeof window === 'undefined') return { left: 0, bottom: 0 }
    const isDesktop = isDesktopViewport()
    const saved = isDesktop ? readSavedFabMap().desktop : readSavedFabMap().mobile
    return saved ? clampFabPos(saved, isDesktop) : defaultFabPos(isDesktop)
  })
  const [dragging, setDragging] = useState(false)

  posRef.current = pos

  useEffect(() => {
    const mq = window.matchMedia(FAB_DESKTOP_QUERY)
    const syncDesktop = () => setDesktop(mq.matches)
    syncDesktop()
    mq.addEventListener('change', syncDesktop)
    return () => mq.removeEventListener('change', syncDesktop)
  }, [])

  useEffect(() => {
    function layout() {
      if (dragRef.current?.dragging) return
      const saved = desktop ? readSavedFabMap().desktop : readSavedFabMap().mobile
      const next = saved ? clampFabPos(saved, desktop) : defaultFabPos(desktop)
      posRef.current = next
      setPos(next)
    }
    layout()
    window.addEventListener('resize', layout)
    const footer = document.querySelector('[data-admin-footer]')
    const dock = document.querySelector('[data-app-version]')
    const observer = footer || dock ? new ResizeObserver(layout) : null
    if (observer && footer) observer.observe(footer)
    if (observer && dock) observer.observe(dock)
    return () => {
      window.removeEventListener('resize', layout)
      observer?.disconnect()
    }
  }, [desktop])

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

  const onFabPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      originLeft: posRef.current.left,
      originBottom: posRef.current.bottom,
      dragging: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onFabPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const dx = event.clientX - drag.originX
      const dy = event.clientY - drag.originY
      if (!drag.dragging) {
        if (Math.hypot(dx, dy) < FAB_DRAG_THRESHOLD) return
        drag.dragging = true
        skipClickRef.current = true
        setDragging(true)
        onCloseMenu()
      }
      const next = clampFabPos(
        { left: drag.originLeft + dx, bottom: drag.originBottom - dy },
        desktop,
      )
      posRef.current = next
      setPos(next)
    },
    [desktop, onCloseMenu],
  )

  const onFabPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      if (drag.dragging) writeSavedFabPos(posRef.current, desktop)
      dragRef.current = null
      setDragging(false)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
    [desktop],
  )

  if (hidden) return null

  return (
    <div
      ref={rootRef}
      data-quick-tools
      className="pointer-events-none fixed z-[25] print:hidden"
      style={{ left: pos.left, bottom: pos.bottom }}
    >
      {menuOpen ? (
        <div
          role="menu"
          className="pointer-events-auto absolute bottom-full left-1/2 mb-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(20,40,40,0.14)]"
        >
          {showDashboard ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-ink-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300"
              onClick={onOpenDashboard}
            >
              <LayoutDashboard className="size-4 shrink-0 text-teal-600" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">{t('quickTools.dashboard')}</span>
                <span className="mt-0.5 block text-xs text-ink-400">{t('quickTools.dashboardHint')}</span>
              </span>
            </button>
          ) : null}
          {showNewFile ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-ink-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300"
              onClick={onOpenNewFile}
            >
              <Plus className="size-4 shrink-0 text-teal-600" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">
                  {t('quickTools.newFile', { year: newFileYear })}
                </span>
                <span className="mt-0.5 block text-xs text-ink-400">{t('quickTools.newFileHint')}</span>
              </span>
            </button>
          ) : null}
          {showMyReservations ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-ink-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300"
              onClick={onOpenMyReservations}
            >
              <ClipboardList className="size-4 shrink-0 text-teal-600" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">{t('quickTools.myReservations')}</span>
                <span className="mt-0.5 block text-xs text-ink-400">{t('quickTools.myReservationsHint')}</span>
              </span>
            </button>
          ) : null}
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
        className={`pointer-events-auto relative size-16 touch-none select-none overflow-hidden rounded-full bg-white shadow-[0_10px_22px_rgba(20,40,40,0.16)] ring-2 ring-white transition hover:ring-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 lg:size-[4.5rem] ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        aria-label={menuOpen ? t('quickTools.close') : t('quickTools.open')}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
        onClick={() => {
          if (skipClickRef.current) {
            skipClickRef.current = false
            return
          }
          onToggleMenu()
        }}
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
