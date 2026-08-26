import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country, Province } from '../../types/app'
import { EntryBorderForm } from './EntryBorderForm'

export function EntryBorderCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [provinceId, setProvinceId] = useState('')

  const countries = useQuery({
    queryKey: ['countries', 'lookup', 'active'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', {
        params: { activeOnly: true },
      })
      return data
    },
  })

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', 'active'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { activeOnly: true },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId, 'active'],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })

  if (!countries.data || !provinces.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('entryBorders.create')}
        subtitle={t('entryBorders.createSubtitle')}
      />
      <EntryBorderForm
        countries={countries.data}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/entry-borders', payload)
          toast.success(t('entryBorders.created'))
          navigate('/base-info/entry-borders')
        }}
      />
    </div>
  )
}
