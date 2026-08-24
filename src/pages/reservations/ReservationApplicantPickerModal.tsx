import { IdCard, Phone, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AppForm,
  Button,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import type { ManagedUser, Paginated } from '../../types/app'

export function ReservationApplicantPickerModal({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (user: ManagedUser) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [term, setTerm] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const query = useQuery({
    queryKey: ['users', 'reservation-applicant-picker', q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser> | ManagedUser[]>('/users', {
        params: { q: q.trim(), page: 1, pageSize: 12 },
      })
      return Array.isArray(data) ? data : data.items
    },
  })

  const rows = query.data ?? []

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setQ(term.trim())
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-applicant-picker-title"
        className={`relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="reservation-applicant-picker-title"
              className="text-base font-semibold text-ink-900"
            >
              {t('reservations.pickApplicantTitle')}
            </h2>
            <p className="mt-1 text-xs leading-6 text-ink-600">
              {t('reservations.pickApplicantHint')}
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.cancel')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          <AppForm onSubmit={onSearch} className="space-y-3" autoFocusFirst>
            <FormField
              icon={Search}
              label={t('common.search')}
              htmlFor="reservation-applicant-search"
            >
              <input
                id="reservation-applicant-search"
                className={fieldClassName}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t('reservations.pickApplicantSearchPlaceholder')}
                autoComplete="off"
              />
            </FormField>
            <Button type="submit" className="w-full sm:w-auto">
              <Search className="size-4" aria-hidden />
              {t('common.search')}
            </Button>
          </AppForm>

          {q.trim().length < 2 ? (
            <p className="rounded-2xl border border-dashed border-line bg-cream-50 px-4 py-6 text-center text-sm text-ink-500">
              {t('reservations.pickApplicantSearchHint')}
            </p>
          ) : query.isLoading ? (
            <p className="py-6 text-center text-sm text-ink-500">{t('common.loading')}</p>
          ) : rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-cream-50 px-4 py-6 text-center text-sm text-ink-500">
              {t('reservations.pickApplicantEmpty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-line bg-white p-3 text-start transition hover:border-teal-300 hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white">
                      <UserRound className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block font-semibold text-ink-900">{item.fullName}</span>
                      <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                        {item.nationalId ? (
                          <span className="inline-flex items-center gap-1">
                            <IdCard className="size-3.5 shrink-0" aria-hidden />
                            {localizeDigits(item.nationalId, locale)}
                          </span>
                        ) : null}
                        {item.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3.5 shrink-0" aria-hidden />
                            {localizeDigits(item.phone, locale)}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
