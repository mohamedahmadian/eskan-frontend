import { Check, Search, UserCheck, UserRound, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, FormField, fieldClassName } from '../../components/ui/Form'
import { PaginationBar, TableCard } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser, Paginated } from '../../types/app'

export type StationManagerChoice = {
  id: string
  fullName: string
  nationalId: string | null
  phone: string | null
}

function toChoice(user: ManagedUser): StationManagerChoice {
  return {
    id: user.id,
    fullName: user.fullName,
    nationalId: user.nationalId,
    phone: user.phone,
  }
}

export function StationManagerPicker({
  value,
  onChange,
}: {
  value: StationManagerChoice | null
  onChange: (next: StationManagerChoice | null) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [term, setTerm] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['users', 'station-manager-picker', q, page],
    enabled: Boolean(q),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>('/users', {
        params: { q, page },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  function runSearch() {
    const next = term.trim()
    if (!next) {
      toast.error(t('walkingStations.managerSearchRequired'))
      return
    }
    setQ(next)
    setPage(1)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.stopPropagation()
    runSearch()
  }

  return (
    <div className="relative space-y-3" data-enter-ignore>
      {value ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <UserRound className="size-4 shrink-0 text-teal-700" aria-hidden />
                {t('walkingStations.managerSelected', { name: value.fullName })}
              </p>
              {(value.nationalId || value.phone) && (
                <p className="mt-1 text-teal-800" dir="ltr">
                  {[value.nationalId, value.phone]
                    .filter(Boolean)
                    .map((item) => localizeDigits(item as string, locale))
                    .join(' — ')}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              icon
              className="size-8 shrink-0 text-ink-500 hover:text-red-700"
              aria-label={t('walkingStations.clearManager')}
              title={t('walkingStations.clearManager')}
              onClick={() => onChange(null)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      <FormField icon={UserRound} label={t('walkingStations.managerName')} htmlFor="station-manager-search">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            id="station-manager-search"
            className={`${fieldClassName} min-w-0 flex-1`}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder={t('walkingStations.managerSearchPlaceholder')}
          />
          <Button type="button" className="shrink-0 sm:min-w-28" onClick={runSearch}>
            <Search className="size-4" aria-hidden />
            {t('common.search')}
          </Button>
        </div>
      </FormField>

      {q ? (
        <>
          {query.isError ? (
            <p className="text-sm text-red-700">
              {getApiErrorMessage(query.error, t('common.error'))}
            </p>
          ) : (
            <TableCard
              loading={query.isLoading}
              empty={t('walkingStations.managerSearchNoResults')}
              hasRows={rows.length > 0}
              rowClick={false}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t('users.fullName')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('users.nationalId')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('users.phone')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((user) => {
                      const selected = value?.id === user.id
                      return (
                        <tr
                          key={user.id}
                          className={`border-t border-line ${selected ? 'bg-teal-50' : ''}`}
                        >
                          <td className="px-4 py-3">{user.fullName}</td>
                          <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                            {user.nationalId ? localizeDigits(user.nationalId, locale) : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                            {user.phone ? localizeDigits(user.phone, locale) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              variant={selected ? 'ghost' : 'soft'}
                              disabled={selected}
                              onClick={() => onChange(toChoice(user))}
                            >
                              {selected ? (
                                <Check className="size-4" aria-hidden />
                              ) : (
                                <UserCheck className="size-4" aria-hidden />
                              )}
                              {selected
                                ? t('walkingStations.managerChosen')
                                : t('walkingStations.selectAsManager')}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}
          {query.data ? (
            <PaginationBar
              page={query.data.page}
              pageSize={query.data.pageSize}
              total={query.data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-ink-500">{t('walkingStations.managerSearchHint')}</p>
      )}
    </div>
  )
}
