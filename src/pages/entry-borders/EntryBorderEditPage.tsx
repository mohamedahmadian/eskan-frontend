import { Fence } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country, EntryBorder, Province } from '../../types/app'
import { EntryBorderForm } from './EntryBorderForm'

export function EntryBorderEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['entry-border', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<EntryBorder>(`/entry-borders/${id}`)
      return data
    },
  })
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const selectedProvinceId = provinceId ?? item.data?.provinceId ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces')
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', selectedProvinceId],
    enabled: Boolean(selectedProvinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId: selectedProvinceId },
      })
      return data
    },
  })

  if (!item.data || !countries.data || !provinces.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('entryBorders.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Fence} />}
      />
      <EntryBorderForm
        initial={item.data}
        countries={countries.data}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/entry-borders/${id}`, payload)
          toast.success(t('entryBorders.updated'))
          navigate(`/base-info/entry-borders/${id}`)
        }}
      />
    </div>
  )
}
