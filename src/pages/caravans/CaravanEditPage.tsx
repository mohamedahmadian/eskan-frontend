import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Caravan, City, Country, ManagedUser, Province } from '../../types/app'
import { CaravanForm } from './CaravanForm'

export function CaravanEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })
  const [countryId, setCountryId] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const selectedCountryId = countryId ?? item.data?.city?.province?.countryId ?? ''
  const selectedProvinceId = provinceId ?? item.data?.city?.provinceId ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

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
    queryKey: ['cities', 'lookup', selectedProvinceId],
    enabled: Boolean(selectedProvinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId: selectedProvinceId, activeOnly: true },
      })
      return data
    },
  })

  const pilgrims = useQuery({
    queryKey: ['pilgrims', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/pilgrims')
      return data
    },
  })

  if (!item.data || !countries.data || !pilgrims.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('caravans.edit')} subtitle={t('caravans.editSubtitle')} />
      <CaravanForm
        initial={item.data}
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        pilgrims={pilgrims.data}
        selectManager
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/caravans/${id}`, payload)
          toast.success(t('caravans.updated'))
          navigate(`/caravans/${id}`)
        }}
      />
    </div>
  )
}
