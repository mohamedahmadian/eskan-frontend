import { Landmark } from 'lucide-react'
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
import type { City, Place, PlaceType, PlaceTypeRef, Province } from '../../types/app'
import { PlaceForm } from './PlaceForm'

export function PlaceEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['place', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Place>(`/places/${id}`)
      return data
    },
  })
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const selectedProvinceId = provinceId ?? item.data?.provinceId ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', { params: { activeOnly: true } })
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

  const placeTypes = useQuery({
    queryKey: ['place-types', 'lookup', 'active'],
    queryFn: async () => {
      const { data } = await api.get<PlaceType[]>('/place-types', {
        params: { activeOnly: true },
      })
      return data
    },
  })

  if (!item.data || !provinces.data || !placeTypes.data) {
    return <LoadingState />
  }

  const types: PlaceTypeRef[] = [...placeTypes.data]
  if (!types.some((type) => type.id === item.data.placeTypeId)) {
    types.unshift(item.data.placeType)
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('places.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Landmark} />}
      />
      <PlaceForm
        initial={item.data}
        provinces={provinces.data}
        cities={cities.data ?? []}
        placeTypes={types}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/places/${id}`, payload)
          toast.success(t('places.updated'))
          navigate(`/base-info/places/${id}`)
        }}
      />
    </div>
  )
}
