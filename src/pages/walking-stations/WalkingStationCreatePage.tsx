import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { emptyStationAmenities, type City, type Country, type Province, type WalkingStation } from '../../types/app'
import { WalkingStationForm } from './WalkingStationForm'

export function WalkingStationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [provinceId, setProvinceId] = useState(searchParams.get('provinceId') ?? '')
  const initialCityId = searchParams.get('cityId') ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', iranId],
    enabled: Boolean(iranId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: iranId, activeOnly: true },
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

  if (!provinces.data) {
    return <LoadingState />
  }

  const initial: WalkingStation | undefined =
    provinceId || initialCityId
      ? {
          id: '',
          name: '',
          cityId: initialCityId,
          city: {
            id: initialCityId,
            nameFa: '',
            nameEn: '',
            provinceId,
            latitude: null,
            longitude: null,
            province: { id: provinceId, nameFa: '', nameEn: '', countryId: iranId },
          },
          latitude: null,
          longitude: null,
          neshanAddress: null,
          maleCount: 0,
          femaleCount: 0,
          managerName: null,
          managerPhone: null,
          managerTelegram: null,
          managerWhatsapp: null,
          managerEitaa: null,
          distanceToMashhadKm: null,
          description: null,
          ...emptyStationAmenities,
          routes: [],
          createdAt: '',
          updatedAt: '',
        }
      : undefined

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('walkingStations.create')} subtitle={t('walkingStations.createSubtitle')} />
      <WalkingStationForm
        initial={initial}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/walking-stations', payload)
          toast.success(t('walkingStations.created'))
          navigate('/base-info/walking-stations')
        }}
      />
    </div>
  )
}
