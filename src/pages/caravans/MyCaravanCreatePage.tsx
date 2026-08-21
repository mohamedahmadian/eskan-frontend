import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Caravan, City, Country, Province } from '../../types/app'
import { CaravanForm } from './CaravanForm'

export function MyCaravanCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [countryId, setCountryId] = useState('')
  const [provinceId, setProvinceId] = useState('')

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
    <div className={formShellClassName}>
      <PageHeader title={t('caravans.create')} subtitle={t('myCaravans.createSubtitle')} />
      <CaravanForm
        initialCountryId={selectedCountryId}
        initialProvinceId={provinceId}
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        selectManager={false}
        currentUserId={user.id}
        defaultCountryId={user.countryId || iranId}
        defaultProvinceId={user.provinceId}
        defaultCityId={user.cityId}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post<Caravan>('/caravans', payload)
          await refresh()
          toast.success(t('caravans.created'))
          navigate('/my-caravans')
        }}
      />
    </div>
  )
}
