import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { fieldClassName } from './Form'

export type SearchSelectOption = {
  value: string
  label: string
  disabled?: boolean
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
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = options.find((option) => option.value === value)
  const display = selected?.label || placeholder || ''

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    setActiveIndex(0)
    searchRef.current?.focus()
  }, [open])

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
    }
  }

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-50' : 'z-20'}`}>
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${fieldClassName} flex items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={() => setOpen((current) => !current)}
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
      {open ? (
        <div
          data-enter-ignore
          className="absolute inset-inline-start-0 z-50 mt-1 w-full rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(20,40,40,0.12)]"
        >
          <div className="border-b border-line p-2">
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
          <ul role="listbox" className="max-h-56 overflow-auto py-1">
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
        </div>
      ) : null}
    </div>
  )
}
