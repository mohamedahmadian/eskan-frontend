import { Filter, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CheckboxField } from '../ui/CheckboxField'
import { PaginationBar, SearchBar, TableCard } from '../ui/ListControls'
import { Button, FormField } from '../ui/Form'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatRoles } from '../../lib/roles'
import type { ManagedUser, Paginated } from '../../types/app'

export type SmsRecipient = {
  id: string
  fullName: string
  phone: string
}

const ROLE_FILTERS = [
  { code: 'PILGRIM', nameKey: 'roles.pilgrim' },
  { code: 'CARAVAN_MANAGER', nameKey: 'roles.caravanManager' },
  { code: 'ACCOMMODATION_MANAGER', nameKey: 'roles.accommodationManager' },
] as const

export function SmsRecipientPicker({
  selected,
  onChange,
}: {
  selected: Record<string, SmsRecipient>
  onChange: (next: Record<string, SmsRecipient>) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [term, setTerm] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [roleCodes, setRoleCodes] = useState<string[]>(ROLE_FILTERS.map((role) => role.code))

  const query = useQuery({
    queryKey: ['sms', 'recipients', q, page, roleCodes],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>('/users', {
        params: {
          q: q || undefined,
          page,
          roleCodes: roleCodes.length ? roleCodes.join(',') : undefined,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const selectable = rows.filter((user) => Boolean(user.phone))
  const allPageSelected =
    selectable.length > 0 && selectable.every((user) => Boolean(selected[user.id]))
  const selectedList = useMemo(() => Object.values(selected), [selected])
  const selectedCount = selectedList.length

  function setRecipient(user: ManagedUser, on: boolean) {
    if (!user.phone) {
      return
    }
    const next = { ...selected }
    if (on) {
      next[user.id] = { id: user.id, fullName: user.fullName, phone: user.phone }
    } else {
      delete next[user.id]
    }
    onChange(next)
  }

  function toggleRole(code: string, on: boolean) {
    setPage(1)
    setRoleCodes((current) =>
      on ? [...current, code] : current.filter((item) => item !== code),
    )
  }

  function togglePage(on: boolean) {
    const next = { ...selected }
    for (const user of selectable) {
      if (on) {
        next[user.id] = { id: user.id, fullName: user.fullName, phone: user.phone! }
      } else {
        delete next[user.id]
      }
    }
    onChange(next)
  }

  function removeRecipient(id: string) {
    const next = { ...selected }
    delete next[id]
    onChange(next)
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-ink-900">{t('sms.recipients')}</h2>
      <SearchBar
        inputId="sms-user-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => {
          setQ(term.trim())
          setPage(1)
        }}
        label={t('common.search')}
        placeholder={t('sms.searchUsersPlaceholder')}
        extra={
          <FormField icon={Filter} label={t('sms.filterRoles')}>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLE_FILTERS.map((role) => (
                <CheckboxField
                  key={role.code}
                  checked={roleCodes.includes(role.code)}
                  onChange={(on) => toggleRole(role.code, on)}
                  label={t(role.nameKey)}
                />
              ))}
            </div>
          </FormField>
        }
        filtersActive={roleCodes.length > 0}
        extraClassName="sm:grid-cols-1"
      />
      {selectedCount > 0 ? (
        <div className="mb-4 rounded-[22px] border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-sm font-medium text-teal-800">
            {selectedCount > 1
              ? t('sms.recipientCount', { count: formatNumber(selectedCount, locale) })
              : t('sms.selectedRecipients')}
          </p>
          <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {selectedList.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 rounded-2xl border border-teal-200 bg-white px-2.5 py-1 text-sm text-ink-800"
              >
                {item.fullName}
                <Button
                  type="button"
                  variant="ghost"
                  icon
                  className="size-7 text-ink-500 hover:text-red-700"
                  aria-label={t('sms.removeRecipient')}
                  title={t('sms.removeRecipient')}
                  onClick={() => removeRecipient(item.id)}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <TableCard
        loading={query.isLoading}
        empty={q ? t('sms.usersNoResults') : t('sms.usersEmpty')}
        hasRows={rows.length > 0}
      >
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="w-14 px-4 py-3 text-start font-medium">
                <div className="w-fit">
                  <CheckboxField
                    checked={allPageSelected}
                    disabled={selectable.length === 0}
                    onChange={togglePage}
                    label={
                      <span className="sr-only">{t('sms.selectAllPage')}</span>
                    }
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-start font-medium">{t('users.fullName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('users.phone')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('users.roles')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => {
              const hasPhone = Boolean(user.phone)
              return (
                <tr key={user.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="w-fit">
                      <CheckboxField
                        checked={Boolean(selected[user.id])}
                        disabled={!hasPhone}
                        onChange={(on) => setRecipient(user, on)}
                        label={<span className="sr-only">{t('sms.select')}</span>}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.fullName}</td>
                  <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                    {user.phone ?? t('sms.noPhone')}
                  </td>
                  <td className="px-4 py-3">{formatRoles(user.roles, t)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  )
}
