import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country, Province } from '../../types/app'
import { AccommodationForm } from './AccommodationForm'

export function MyAccommodationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [countryId, setCountryId] = useState(user?.countryId ?? '')
  const [provinceId, setProvinceId] = useState(user?.provinceId ?? '')

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''
  const selectedCountryId = countryId || user?.countryId || iranId

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', selectedCountryId],
    enabled: Boolean(selectedCountryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: selectedCountryId, activeOnly: true },
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

  if (!countries.data || !user) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('accommodations.create')}
        subtitle={t('myAccommodations.createSubtitle')}
      />
      <AccommodationForm
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        isAdmin={false}
        currentUserId={user.id}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/accommodations', payload)
          await refresh()
          toast.success(t('accommodations.created'))
          navigate('/my-accommodations')
        }}
      />
    </div>
  )
}
