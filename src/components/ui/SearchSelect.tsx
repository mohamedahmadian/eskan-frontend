import { Check, ChevronDown, Search } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { fieldClassName } from './Form'

export type SearchSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type MenuPos = {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

const MENU_GAP = 4
const VIEW_MARGIN = 8
const MENU_MAX = 280

function placeMenu(trigger: DOMRect): MenuPos {
  const width = Math.min(trigger.width, window.innerWidth - VIEW_MARGIN * 2)
  const spaceBelow = window.innerHeight - trigger.bottom - VIEW_MARGIN
  const spaceAbove = trigger.top - VIEW_MARGIN
  const showAbove = spaceBelow < 160 && spaceAbove > spaceBelow
  const available = (showAbove ? spaceAbove : spaceBelow) - MENU_GAP
  const maxHeight = Math.max(120, Math.min(MENU_MAX, available))
  let left = trigger.left
  if (left + width > window.innerWidth - VIEW_MARGIN) {
    left = window.innerWidth - width - VIEW_MARGIN
  }
  left = Math.max(VIEW_MARGIN, left)
  if (showAbove) {
    return {
      bottom: window.innerHeight - trigger.top + MENU_GAP,
      left,
      width,
      maxHeight,
    }
  }
  return {
    top: trigger.bottom + MENU_GAP,
    left,
    width,
    maxHeight,
  }
}

function samePos(a: MenuPos | null, b: MenuPos) {
  return (
    a != null &&
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight
  )
}

export function SearchSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  options: SearchSelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [pos, setPos] = useState<MenuPos | null>(null)

  const selected = options.find((option) => option.value === value)
  const display = selected?.label || placeholder || ''

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, query])

  const updatePlace = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return
    if (
      trigger.bottom < 0 ||
      trigger.top > window.innerHeight ||
      trigger.right < 0 ||
      trigger.left > window.innerWidth
    ) {
      setOpen(false)
      return
    }
    const next = placeMenu(trigger)
    setPos((current) => (samePos(current, next) ? current : next))
  }, [])

  function openMenu() {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (trigger) setPos(placeMenu(trigger))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setPos(null)
      return
    }
    setActiveIndex(0)
    searchRef.current?.focus({ preventScroll: true })
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    updatePlace()
  }, [open, filtered.length, query, updatePlace])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = (event: Event) => {
      if (event.type === 'scroll' && menuRef.current?.contains(event.target as Node)) return
      updatePlace()
    }
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updatePlace])

  function selectOption(option: SearchSelectOption) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[activeIndex]
      if (option) selectOption(option)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus({ preventScroll: true })
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${fieldClassName} flex items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={() => {
          if (open) setOpen(false)
          else openMenu()
        }}
      >
        <span className={selected ? 'text-ink-900' : 'text-ink-400'}>{display}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-teal-600 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <input
        name={name}
        value={value}
        required={required}
        tabIndex={-1}
        readOnly
        aria-hidden
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        onFocus={() => document.getElementById(fieldId)?.focus()}
      />
      {open
        ? createPortal(
            <div
              ref={menuRef}
              data-enter-ignore
              style={{
                top: pos?.top ?? 'auto',
                bottom: pos?.bottom ?? 'auto',
                left: pos?.left ?? 0,
                width: pos?.width ?? triggerRef.current?.offsetWidth,
                maxHeight: pos?.maxHeight,
                visibility: pos ? 'visible' : 'hidden',
              }}
              className="fixed z-[80] flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(20,40,40,0.12)]"
            >
              <div className="shrink-0 border-b border-line p-2">
                <label className="flex items-center gap-2 rounded-xl bg-cream-50 px-3 py-2">
                  <Search className="size-4 shrink-0 text-teal-600" aria-hidden />
                  <input
                    ref={searchRef}
                    className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setActiveIndex(0)
                    }}
                    onKeyDown={onSearchKeyDown}
                    placeholder={t('common.searchList')}
                  />
                </label>
              </div>
              <ul role="listbox" className="min-h-0 flex-1 overflow-auto py-1">
                {filtered.length ? (
                  filtered.map((option, index) => {
                    const isActive = index === activeIndex
                    const isSelected = option.value === value
                    return (
                      <li key={`${option.value}-${index}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm transition ${
                            isActive ? 'bg-teal-50 text-teal-800' : 'text-ink-800'
                          } ${option.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-cream-50'}`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectOption(option)}
                        >
                          <span>{option.label}</span>
                          {isSelected ? <Check className="size-4 text-teal-600" aria-hidden /> : null}
                        </button>
                      </li>
                    )
                  })
                ) : (
                  <li className="px-3 py-3 text-sm text-ink-500">{t('common.noResults')}</li>
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
