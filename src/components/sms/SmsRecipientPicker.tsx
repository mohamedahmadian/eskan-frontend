import { Filter, Flag, MapPin, MapPinned, Send, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CheckboxField } from '../ui/CheckboxField'
import {
  FilterPair,
  PaginationBar,
  SearchBar,
  TableCard,
} from '../ui/ListControls'
import { Button, FormField, cardClassName } from '../ui/Form'
import { SearchSelect } from '../ui/SearchSelect'
import { api } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { formatRoles } from '../../lib/roles'
import type { City, Country, ManagedUser, Paginated, Province } from '../../types/app'

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
  initialSelected,
  onConfirm,
  onClose,
}: {
  initialSelected: Record<string, SmsRecipient>
  onConfirm: (next: Record<string, SmsRecipient>) => void
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const [selected, setSelected] = useState<Record<string, SmsRecipient>>(initialSelected)
  const [term, setTerm] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [roleCodes, setRoleCodes] = useState<string[]>(ROLE_FILTERS.map((role) => role.code))
  const [countryId, setCountryId] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [cityId, setCityId] = useState('')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId },
      })
      return data
    },
  })

  const query = useQuery({
    queryKey: ['sms', 'recipients', q, page, roleCodes, countryId, provinceId, cityId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>('/users', {
        params: {
          q: q || undefined,
          page,
          roleCodes: roleCodes.length ? roleCodes.join(',') : undefined,
          countryId: countryId || undefined,
          provinceId: provinceId || undefined,
          cityId: cityId || undefined,
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
  const filtersActive =
    Boolean(countryId || provinceId || cityId) || roleCodes.length !== ROLE_FILTERS.length

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
    setSelected(next)
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
    setSelected(next)
  }

  function removeRecipient(id: string) {
    const next = { ...selected }
    delete next[id]
    setSelected(next)
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
        aria-labelledby="sms-group-picker-title"
        className={`relative z-10 flex max-h-[min(92vh,52rem)] w-full max-w-5xl flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="sms-group-picker-title"
              className="text-base font-semibold text-ink-900"
            >
              {t('sms.groupSms')}
            </h2>
            <p className="mt-1 text-xs leading-6 text-ink-600">{t('sms.groupSmsHint')}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.cancel')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
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
            bare
            extra={
              <>
                <FilterPair columns={3}>
                  <FormField icon={Flag} label={t('geo.country')} htmlFor="sms-country">
                    <SearchSelect
                      id="sms-country"
                      value={countryId}
                      placeholder={t('geo.allCountries')}
                      onChange={(next) => {
                        setCountryId(next)
                        setProvinceId('')
                        setCityId('')
                        setPage(1)
                      }}
                      options={[
                        { value: '', label: t('geo.allCountries') },
                        ...(countries.data ?? []).map((country) => ({
                          value: country.id,
                          label: geoName(country),
                        })),
                      ]}
                    />
                  </FormField>
                  <FormField icon={MapPinned} label={t('geo.province')} htmlFor="sms-province">
                    <SearchSelect
                      id="sms-province"
                      value={provinceId}
                      disabled={!countryId}
                      placeholder={t('geo.allProvinces')}
                      onChange={(next) => {
                        setProvinceId(next)
                        setCityId('')
                        setPage(1)
                      }}
                      options={[
                        { value: '', label: t('geo.allProvinces') },
                        ...(provinces.data ?? []).map((province) => ({
                          value: province.id,
                          label: geoName(province),
                        })),
                      ]}
                    />
                  </FormField>
                  <FormField icon={MapPin} label={t('geo.city')} htmlFor="sms-city">
                    <SearchSelect
                      id="sms-city"
                      value={cityId}
                      disabled={!provinceId}
                      placeholder={t('geo.allCities')}
                      onChange={(next) => {
                        setCityId(next)
                        setPage(1)
                      }}
                      options={[
                        { value: '', label: t('geo.allCities') },
                        ...(cities.data ?? []).map((city) => ({
                          value: city.id,
                          label: geoName(city),
                        })),
                      ]}
                    />
                  </FormField>
                </FilterPair>
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
              </>
            }
            filtersActive={filtersActive}
            extraClassName="sm:grid-cols-1"
          />
          {selectedCount > 0 ? (
            <div className="rounded-[22px] border border-teal-200 bg-teal-50 px-4 py-3">
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
                          label={<span className="sr-only">{t('sms.selectAllPage')}</span>}
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
                    const isSelected = Boolean(selected[user.id])
                    return (
                      <tr
                        key={user.id}
                        className={`border-t border-line${
                          hasPhone ? ' cursor-pointer hover:bg-cream-50' : ''
                        }`}
                        onClick={
                          hasPhone
                            ? () => setRecipient(user, !isSelected)
                            : undefined
                        }
                      >
                        <td
                          className="px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="w-fit">
                            <CheckboxField
                              checked={isSelected}
                              disabled={!hasPhone}
                              onChange={(on) => setRecipient(user, on)}
                              label={<span className="sr-only">{t('sms.select')}</span>}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">{user.fullName}</td>
                        <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                          {user.phone ? localizeDigits(user.phone, locale) : t('sms.noPhone')}
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
        </div>

        <div className="border-t border-line px-5 py-4 sm:px-6">
          <Button type="button" onClick={() => onConfirm(selected)}>
            <Send className="size-4" aria-hidden />
            {t('sms.sendGroupSms')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function SmsGroupSmsButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <Button type="button" variant="soft" onClick={onClick}>
      <Users className="size-4" aria-hidden />
      {t('sms.groupSms')}
    </Button>
  )
}
