import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { isAdmin } from '../../lib/roles'
import type { City, Country, ManagedUser, Province } from '../../types/app'
import { AccommodationForm } from './AccommodationForm'

export function AccommodationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  if (!countries.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t('accommodations.create')} subtitle={t('accommodations.createSubtitle')} />
      <AccommodationForm
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        users={users.data ?? []}
        isAdmin={admin}
        currentUserId={user?.id}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/accommodations', payload)
          toast.success(t('accommodations.created'))
          navigate('/accommodations', { replace: true })
        }}
      />
    </div>
  )
}
