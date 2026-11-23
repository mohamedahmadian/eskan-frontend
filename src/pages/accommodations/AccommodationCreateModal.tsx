import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { AppModal } from '../../components/ui/AppModal'
import { LoadingState } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import { accommodationStatuses, type City, type Country, type ManagedUser, type Province } from '../../types/app'
import { AccommodationForm } from './AccommodationForm'

export function AccommodationCreateModal({
  year,
  onClose,
  onCreated,
}: {
  year: number
  onClose: () => void
  onCreated: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [countryId, setCountryId] = useState('')
  const [provinceId, setProvinceId] = useState('')

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId, activeOnly: true },
      })
      return data
    },
  })
  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })
  const users = useQuery({
    queryKey: ['users', 'lookup', 'ACCOMMODATION_MANAGER'],
    enabled: admin,
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'ACCOMMODATION_MANAGER' },
      })
      return data
    },
  })

  const yearLabel = formatNumber(year, locale)

  return (
    <AppModal
      onClose={onClose}
      ariaLabel={t('accommodations.create')}
      zClassName="z-[80]"
      className="flex max-h-[90vh] w-full max-w-4xl flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!countries.data ? (
          <LoadingState />
        ) : (
          <AccommodationForm
            countries={countries.data}
            provinces={provinces.data ?? []}
            cities={cities.data ?? []}
            users={users.data ?? []}
            isAdmin={admin}
            currentUserId={user?.id}
            activityYear={year}
            lockActivityYear
            contactsOptional
            autoFocus
            createSubtitle={t('accommodationYearManagement.addAccommodationSubtitle', {
              year: yearLabel,
            })}
            onCountryChange={setCountryId}
            onProvinceChange={setProvinceId}
            onCancel={onClose}
            onSubmit={async (payload) => {
              await api.post('/accommodations', {
                ...payload,
                status: accommodationStatuses.ACTIVE,
                year,
              })
              toast.success(t('accommodations.created'))
              onCreated()
            }}
          />
        )}
      </div>
    </AppModal>
  )
}
