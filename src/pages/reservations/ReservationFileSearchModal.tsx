import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { useQuickTools } from '../../components/layout/quick-tools-context'
import { AppForm, Button, cardClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { parseClipboardReservationFile, readClipboardText } from '../../lib/clipboard'
import { currentPersianYear, toLatinDigits } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import type { Paginated, ReservationListItem } from '../../types/app'
import { ReservationStatusBadge, ReservationTypeBadge } from './ReservationStatusBadge'
import { ReservationCodeBadge } from './ReservationCodeBadge'

const SEQ_MAX = 6

function digitsOnly(raw: string, max: number) {
  return toLatinDigits(raw).replace(/\D/g, '').slice(0, max)
}

function splitYearAndSeq(raw: string, yearHint: string): { year: string; seq: string } {
  const digits = toLatinDigits(raw).replace(/\D/g, '')
  const hint = digitsOnly(yearHint, 4)

  if (hint.length === 4 && digits.startsWith(hint) && digits.length > hint.length) {
    return { year: hint, seq: digits.slice(hint.length).slice(0, SEQ_MAX) }
  }

  const dashed = toLatinDigits(raw)
    .trim()
    .replace(/[\s\u200e\u200f\ufeff]/g, '')
  const dashedMatch = dashed.match(/^(\d{4})-(\d{1,6})$/)
  if (dashedMatch) {
    return { year: dashedMatch[1], seq: dashedMatch[2] }
  }

  const prefixed = digits.match(/^(1[3-4]\d{2})(\d{1,6})$/)
  if (prefixed && digits.length > 4) {
    return { year: prefixed[1], seq: prefixed[2] }
  }

  return { year: hint, seq: digits.slice(0, SEQ_MAX) }
}

export function ReservationFileSearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const adminList = isAdmin(user)
  const seqRef = useRef<HTMLInputElement>(null)
  const tools = useQuickTools()
  const currentYear = String(currentPersianYear())
  const [year, setYear] = useState(currentYear)
  const [seq, setSeq] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [rows, setRows] = useState<ReservationListItem[]>([])

  useEffect(() => {
    if (!tools) return
    return tools.registerFileFocus(() => {
      const el = seqRef.current
      if (!el) return
      el.focus()
      el.select()
    })
  }, [tools])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    seqRef.current?.focus()
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

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const raw = await readClipboardText()
      if (cancelled || raw == null) return
      const parsed = parseClipboardReservationFile(raw)
      if (!parsed) return
      let applied = false
      setSeq((prev) => {
        if (prev) return prev
        applied = true
        return parsed.seq
      })
      if (!applied) return
      setYear(parsed.year)
      requestAnimationFrame(() => {
        const el = seqRef.current
        if (!el) return
        el.focus()
        el.select()
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function listPath(yearDigits: string) {
    const path = adminList ? '/reservations' : '/my-reservations'
    return `${path}?year=${yearDigits}`
  }

  function openFile(row: ReservationListItem) {
    onClose()
    navigate(adminList ? `/reservations/${row.id}` : `/my-reservations/${row.id}`)
  }

  function openList(yearDigits: string) {
    onClose()
    navigate(listPath(yearDigits))
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    const yearDigits = digitsOnly(year, 4) || currentYear
    const seqDigits = digitsOnly(seq, SEQ_MAX)
    if (!seqDigits) {
      openList(yearDigits)
      return
    }
    const q = `${yearDigits}-${seqDigits}`
    setSearching(true)
    try {
      const { data } = await api.get<Paginated<ReservationListItem>>(
        adminList ? '/reservations' : '/reservations/mine',
        {
          params: { q, page: 1, pageSize: 20 },
        },
      )
      const items = data.items
      const exact = items.find((item) => item.code === q)
      setSearched(true)
      if (exact) {
        openFile(exact)
        return
      }
      if (items.length === 1) {
        openFile(items[0])
        return
      }
      setRows(items)
      if (items.length === 0) {
        requestAnimationFrame(() => {
          const el = seqRef.current
          if (!el) return
          el.focus()
          el.select()
        })
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSearching(false)
    }
  }

  const boxClass =
    'rounded-2xl border border-line bg-cream-50 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200'

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
        aria-labelledby="quick-tools-file-search-title"
        className={`relative z-10 flex w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2
            id="quick-tools-file-search-title"
            className="min-w-0 text-sm font-semibold leading-6 text-ink-900"
          >
            {t('quickTools.searchFileTitle')}
          </h2>
          <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('common.close')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 space-y-3 p-3 sm:p-4">
          <AppForm data-enter-immediate="" onSubmit={onSearch} autoFocusFirst={false}>
            <div className="flex items-stretch gap-2">
              <div dir="ltr" className="flex min-w-0 flex-1 items-center gap-2">
                <label htmlFor="reservation-file-year" className="sr-only">
                  {t('reservations.year')}
                </label>
                <input
                  id="reservation-file-year"
                  className={`${boxClass} digit-field w-20 shrink-0 px-2 text-center`}
                  value={year}
                  onChange={(event) => setYear(digitsOnly(event.target.value, 4))}
                  onBlur={() => {
                    if (!digitsOnly(year, 4)) setYear(currentYear)
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="shrink-0 text-lg font-bold leading-none text-ink-400" aria-hidden>
                  -
                </span>
                <label htmlFor="reservation-file-seq" className="sr-only">
                  {t('quickTools.searchFileNumber')}
                </label>
                <input
                  ref={seqRef}
                  id="reservation-file-seq"
                  className={`${boxClass} digit-field min-w-16 w-0 flex-1 px-3 !text-left`}
                  value={seq}
                  onChange={(event) => {
                    const parsed = splitYearAndSeq(event.target.value, year)
                    if (parsed.year && parsed.year !== year) setYear(parsed.year)
                    setSeq(parsed.seq)
                  }}
                  placeholder={t('quickTools.searchFileNumber')}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <Button type="submit" disabled={searching} className="shrink-0">
                <Search className="size-4" aria-hidden />
                {t('common.search')}
              </Button>
            </div>
          </AppForm>
          {searched && !searching && rows.length === 0 ? (
            <FormEmptyHint>{t('reservations.noResults')}</FormEmptyHint>
          ) : null}
          {rows.length > 0 ? (
            <ul className="max-h-[min(50vh,22rem)] divide-y divide-line overflow-y-auto rounded-2xl border border-line">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition hover:bg-teal-50"
                    onClick={() => openFile(row)}
                  >
                    <ReservationCodeBadge code={row.code} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-800">
                        {row.caravan?.name ?? row.group?.name ?? row.createdBy?.fullName ?? '—'}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <ReservationTypeBadge type={row.type} />
                        <ReservationStatusBadge status={row.status} />
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
