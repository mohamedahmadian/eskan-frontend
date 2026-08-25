import { Check, Pencil, Search, Trash2, UserCheck, UserPlus, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
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
  defaultNationalId,
}: {
  value: CaravanManagerChoice | null
  onChange: (next: CaravanManagerChoice | null) => void
  /** Prefill search, run it, and auto-select the matching pilgrim (e.g. file applicant). */
  defaultNationalId?: string | null
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const preset = defaultNationalId?.trim() || ''
  const [term, setTerm] = useState(preset)
  const [q, setQ] = useState(preset)
  const [page, setPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const autoSelectedForQ = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!preset) return
    setTerm(preset)
    setQ(preset)
    setPage(1)
    autoSelectedForQ.current = null
  }, [preset])

  useEffect(() => {
    if (!searching) return
    document.getElementById('caravan-manager-search')?.focus()
  }, [searching])

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

  useEffect(() => {
    if (!value) autoSelectedForQ.current = null
  }, [value])

  useEffect(() => {
    if (!q || value) return
    if (autoSelectedForQ.current === q) return
    if (!query.isSuccess || !query.data) return
    const items = query.data.items
    const match =
      items.find((user) => user.nationalId === q) ??
      (query.data.total === 1 ? items[0] : undefined)
    if (!match) return
    autoSelectedForQ.current = q
    onChangeRef.current(toChoice(match))
    setSearching(false)
    setTerm('')
    setQ('')
    setPage(1)
  }, [q, value, query.isSuccess, query.data])

  const rows = query.data?.items ?? []

  function closeSearch() {
    setSearching(false)
    setTerm('')
    setQ('')
    setPage(1)
  }

  function openSearch() {
    setSearching(true)
  }

  function clearManager() {
    onChange(null)
    closeSearch()
  }

  function chooseManager(user: ManagedUser) {
    onChange(toChoice(user))
    closeSearch()
  }

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
        tabIndex={-1}
        readOnly
        aria-hidden
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        onFocus={() => {
          openSearch()
          document.getElementById('caravan-manager-search')?.focus()
        }}
      />

      <FormField
        icon={UserRound}
        label={t('caravans.manager')}
        htmlFor={searching ? 'caravan-manager-search' : undefined}
      >
        <div className="flex w-full flex-col gap-3">
          <div
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
              value
                ? 'border-teal-200 bg-teal-50 text-teal-900'
                : 'border-dashed border-line bg-cream-50 text-ink-500'
            }`}
          >
            <div className="min-w-0 flex-1">
              {value ? (
                <>
                  <p className="flex items-center gap-2 font-medium">
                    <UserRound className="size-4 shrink-0 text-teal-700" aria-hidden />
                    {t('caravans.managerSelected', { name: value.fullName })}
                  </p>
                  {value.nationalId || value.phone ? (
                    <p className="mt-1 text-teal-800" dir="ltr">
                      {[value.nationalId, value.phone]
                        .filter(Boolean)
                        .map((item) => localizeDigits(item as string, locale))
                        .join(' — ')}
                    </p>
                  ) : (
                    <p className="mt-1 text-teal-800">{t('caravans.managerNoIdentity')}</p>
                  )}
                </>
              ) : (
                <p>{t('caravans.managerEmpty')}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {value ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!h-8 !px-2.5 !py-1 !text-xs"
                    onClick={() => (searching ? closeSearch() : openSearch())}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {t('caravans.changeManager')}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="!h-8 !px-2.5 !py-1 !text-xs"
                    onClick={clearManager}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {t('common.delete')}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="soft"
                  className="!h-8 !px-2.5 !py-1 !text-xs"
                  onClick={() => (searching ? closeSearch() : openSearch())}
                >
                  <UserPlus className="size-3.5" aria-hidden />
                  {t('caravans.addManager')}
                </Button>
              )}
            </div>
          </div>

          {searching ? (
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
          ) : null}
        </div>
      </FormField>

      {searching && q ? (
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
                              onClick={() => chooseManager(user)}
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
      ) : searching ? (
        <p className="text-sm text-ink-500">{t('caravans.managerSearchHint')}</p>
      ) : null}
    </div>
  )
}
