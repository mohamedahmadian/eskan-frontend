import { Check, Search, UserCheck, UserRound } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, FormField, fieldClassName } from '../../components/ui/Form'
import { PaginationBar, TableCard } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser, Paginated } from '../../types/app'

export type CaravanManagerChoice = {
  id: string
  fullName: string
  nationalId: string | null
  phone: string | null
  countryId: string | null
  provinceId: string | null
  cityId: string | null
}

function toChoice(user: ManagedUser): CaravanManagerChoice {
  return {
    id: user.id,
    fullName: user.fullName,
    nationalId: user.nationalId,
    phone: user.phone,
    countryId: user.countryId,
    provinceId: user.provinceId,
    cityId: user.cityId,
  }
}

export function CaravanManagerPicker({
  value,
  onChange,
}: {
  value: CaravanManagerChoice | null
  onChange: (next: CaravanManagerChoice) => void
}) {
  const { t } = useTranslation()
  const [term, setTerm] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['pilgrims', 'manager-picker', q, page],
    enabled: Boolean(q),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>('/pilgrims', {
        params: { q, page },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  function runSearch() {
    const next = term.trim()
    if (!next) {
      toast.error(t('caravans.managerSearchRequired'))
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
      <input
        id="managerUserId"
        value={value?.id ?? ''}
        required
        tabIndex={-1}
        readOnly
        aria-hidden
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        onFocus={() => document.getElementById('caravan-manager-search')?.focus()}
      />

      {value ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          <p className="flex items-center gap-2 font-medium">
            <UserRound className="size-4 shrink-0 text-teal-700" aria-hidden />
            {t('caravans.managerSelected', { name: value.fullName })}
          </p>
          {value.nationalId || value.phone ? (
            <p className="mt-1 text-teal-800" dir="ltr">
              {[value.nationalId, value.phone].filter(Boolean).join(' — ')}
            </p>
          ) : (
            <p className="mt-1 text-teal-800">{t('caravans.managerNoIdentity')}</p>
          )}
        </div>
      ) : null}

      <FormField icon={UserRound} label={t('caravans.manager')} htmlFor="caravan-manager-search">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            id="caravan-manager-search"
            className={`${fieldClassName} min-w-0 flex-1`}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder={t('caravans.managerSearchPlaceholder')}
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
              empty={t('caravans.managerSearchNoResults')}
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
                            {user.nationalId ?? '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                            {user.phone ?? '—'}
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
                                ? t('caravans.managerChosen')
                                : t('caravans.selectAsManager')}
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
        <p className="text-sm text-ink-500">{t('caravans.managerSearchHint')}</p>
      )}
    </div>
  )
}
