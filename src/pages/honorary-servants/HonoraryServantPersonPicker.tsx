import { Search, UserRound, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, FormField, fieldClassName } from '../../components/ui/Form'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { api, getApiErrorMessage } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import type { HonoraryServantPerson, ManagedUser, Paginated } from '../../types/app'

function toPerson(user: Pick<ManagedUser, 'id' | 'fullName' | 'firstName' | 'lastName' | 'nationalId' | 'phone'>): HonoraryServantPerson {
  return {
    id: user.id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    nationalId: user.nationalId,
    phone: user.phone,
  }
}

export function HonoraryServantPersonPicker({
  value,
  onChange,
  locked,
}: {
  value: HonoraryServantPerson | null
  onChange: (next: HonoraryServantPerson | null) => void
  locked?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [term, setTerm] = useState('')
  const [q, setQ] = useState('')

  const query = useQuery({
    queryKey: ['users', 'honorary-servant-picker', q],
    enabled: Boolean(q) && !locked && !value,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>('/users', {
        params: { q, page: 1, pageSize: 8 },
      })
      return data
    },
  })

  function runSearch() {
    const next = term.trim()
    if (!next) {
      toast.error(t('honoraryServants.personSearchRequired'))
      return
    }
    setQ(next)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.stopPropagation()
    runSearch()
  }

  const rows = query.data?.items ?? []

  return (
    <div className="space-y-3" data-enter-ignore>
      {value ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-teal-200 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-ink-900">
              <UserRound className="size-4 shrink-0 text-teal-700" aria-hidden />
              {value.fullName}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-600">
              {value.nationalId ? <CopyableDigits value={value.nationalId} /> : null}
              {value.phone ? <CopyableDigits value={value.phone} /> : null}
            </div>
          </div>
          {locked ? null : (
            <Button
              type="button"
              variant="ghost"
              icon
              className="size-8 shrink-0 text-ink-500 hover:text-red-700"
              aria-label={t('honoraryServants.changePerson')}
              title={t('honoraryServants.changePerson')}
              onClick={() => {
                onChange(null)
                setQ('')
              }}
            >
              <X className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      ) : (
        <>
          <FormField icon={UserRound} label={t('honoraryServants.person')} htmlFor="honorary-person-search">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                id="honorary-person-search"
                className={`${fieldClassName} min-w-0 flex-1`}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder={t('honoraryServants.personSearchPlaceholder')}
              />
              <Button type="button" className="shrink-0 sm:min-w-28" onClick={runSearch}>
                <Search className="size-4" aria-hidden />
                {t('common.search')}
              </Button>
            </div>
          </FormField>
          {q ? (
            <div className="space-y-2">
              {query.isLoading ? (
                <p className="px-1 text-sm text-ink-500">{t('common.loading')}</p>
              ) : rows.length === 0 ? (
                <p className="px-1 text-sm text-ink-500">{t('common.noResults')}</p>
              ) : (
                <ul className="grid gap-2">
                  {rows.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-cream-50 px-4 py-3 text-start text-sm text-ink-800 transition hover:border-teal-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                        onClick={() => onChange(toPerson(user))}
                      >
                        <span className="font-medium text-ink-900">{user.fullName}</span>
                        <span className="text-ink-500" dir="ltr">
                          {[user.nationalId, user.phone]
                            .filter(Boolean)
                            .map((item) => localizeDigits(item as string, locale))
                            .join(' · ')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.isError ? (
                <p className="text-sm text-red-700">
                  {getApiErrorMessage(query.error, t('common.error'))}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
