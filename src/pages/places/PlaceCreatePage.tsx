import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Place, PlaceType, Province } from '../../types/app'
import { PlaceForm } from './PlaceForm'

export function PlaceCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [provinceId, setProvinceId] = useState(searchParams.get('provinceId') ?? '')
  const initialCityId = searchParams.get('cityId') ?? ''
  const initialPlaceTypeId = searchParams.get('placeTypeId') ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', { params: { activeOnly: true } })
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

  const placeTypes = useQuery({
    queryKey: ['place-types', 'lookup', 'active'],
    queryFn: async () => {
      const { data } = await api.get<PlaceType[]>('/place-types', {
        params: { activeOnly: true },
      })
      return data
    },
  })

  if (!provinces.data || !placeTypes.data) {
    return <LoadingState />
  }

  const listQuery = new URLSearchParams({
    ...(provinceId ? { provinceId } : {}),
    ...(initialCityId ? { cityId: initialCityId } : {}),
    ...(initialPlaceTypeId ? { placeTypeId: initialPlaceTypeId } : {}),
  }).toString()
  const listTo = listQuery ? `/base-info/places?${listQuery}` : '/base-info/places'

  const initial: Place | undefined =
    provinceId || initialCityId || initialPlaceTypeId
      ? {
          id: '',
          name: '',
          phone: null,
          address: null,
          neshanAddress: null,
          latitude: null,
          longitude: null,
          description: null,
          placeTypeId: initialPlaceTypeId,
          provinceId,
          cityId: initialCityId,
          placeType: {
            id: initialPlaceTypeId,
            code: '',
            nameFa: '',
            nameEn: '',
            icon: 'landmark',
            isActive: true,
          },
          province: { id: provinceId, nameFa: '', nameEn: '', countryId: '' },
          city: { id: initialCityId, nameFa: '', nameEn: '', provinceId },
          createdAt: '',
          updatedAt: '',
        }
      : undefined

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('places.create')} subtitle={t('places.createSubtitle')} />
      <PlaceForm
        initial={initial}
        provinces={provinces.data}
        cities={cities.data ?? []}
        placeTypes={placeTypes.data}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/places', payload)
          toast.success(t('places.created'))
          navigate(listTo)
        }}
      />
    </div>
  )
}
