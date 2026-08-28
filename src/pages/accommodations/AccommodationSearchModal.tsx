import { Building2, List, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { AppForm, Button, cardClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import { hasMenuAccess, hasModuleAccess } from '../../routes/RequireMenuAccess'
import type { Accommodation, Paginated } from '../../types/app'

export function AccommodationSearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const nameOf = useGeoName()
  const inputRef = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [rows, setRows] = useState<Accommodation[]>([])
  const canBrowseAll =
    hasMenuAccess('/accommodations', user?.modules ?? []) ||
    hasModuleAccess('accommodation', user?.modules ?? [])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function openItem(item: Accommodation) {
    onClose()
    navigate(canBrowseAll ? `/accommodations/${item.id}` : `/my-accommodations/${item.id}`)
  }

  function openAll() {
    onClose()
    navigate(canBrowseAll ? '/accommodations' : '/my-accommodations')
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    const q = term.trim()
    if (!q) {
      toast.error(t('quickTools.searchAccommodationRequired'))
      inputRef.current?.focus()
      return
    }
    setSearching(true)
    try {
      const { data } = await api.get<Paginated<Accommodation>>(
        canBrowseAll ? '/accommodations' : '/accommodations/mine',
        { params: { q, page: 1, pageSize: 20 } },
      )
      const items = data.items
      const exact = items.find((item) => item.name.trim() === q)
      setSearched(true)
      if (exact) {
        openItem(exact)
        return
      }
      if (items.length === 1) {
        openItem(items[0])
        return
      }
      setRows(items)
      if (items.length === 0) {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
          inputRef.current?.select()
        })
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSearching(false)
    }
  }

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
        aria-labelledby="quick-tools-accommodation-search-title"
        className={`relative z-10 flex w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2
            id="quick-tools-accommodation-search-title"
            className="min-w-0 text-sm font-semibold leading-6 text-ink-900"
          >
            {t('quickTools.searchAccommodationTitle')}
          </h2>
          <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('common.close')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 space-y-3 p-3 sm:p-4">
          <AppForm data-enter-immediate="" onSubmit={onSearch} autoFocusFirst={false}>
            <div className="flex items-stretch gap-2">
              <label htmlFor="accommodation-search-name" className="sr-only">
                {t('accommodations.name')}
              </label>
              <input
                ref={inputRef}
                id="accommodation-search-name"
                className="min-w-0 flex-1 rounded-2xl border border-line bg-cream-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t('quickTools.searchAccommodationPlaceholder')}
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" disabled={searching} className="shrink-0">
                <Search className="size-4" aria-hidden />
                {t('common.search')}
              </Button>
            </div>
          </AppForm>
          <Button type="button" variant="ghost" className="w-full" onClick={openAll}>
            <List className="size-4" aria-hidden />
            {t('quickTools.viewAllAccommodations')}
          </Button>
          {searched && !searching && rows.length === 0 ? (
            <FormEmptyHint>{t('accommodations.noResults')}</FormEmptyHint>
          ) : null}
          {rows.length > 0 ? (
            <ul className="max-h-[min(50vh,22rem)] divide-y divide-line overflow-y-auto rounded-2xl border border-line">
              {rows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition hover:bg-teal-50"
                    onClick={() => openItem(item)}
                  >
                    <Building2 className="size-4 shrink-0 text-teal-600" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-800">{item.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500">
                        {[item.city ? nameOf(item.city) : '', t(`accommodationTypes.${item.type}`)]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
