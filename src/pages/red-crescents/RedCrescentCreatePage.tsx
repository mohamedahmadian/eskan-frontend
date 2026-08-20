import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Province } from '../../types/app'
import { RedCrescentForm } from './RedCrescentForm'

export function RedCrescentCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [provinceId, setProvinceId] = useState(searchParams.get('provinceId') ?? '')
  const initialCityId = searchParams.get('cityId') ?? ''

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

  if (!provinces.data) {
    return <LoadingState />
  }

  const listQuery = new URLSearchParams({
    ...(provinceId ? { provinceId } : {}),
    ...(initialCityId ? { cityId: initialCityId } : {}),
  }).toString()
  const listTo = listQuery
    ? `/base-info/red-crescents?${listQuery}`
    : '/base-info/red-crescents'

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('redCrescents.create')} subtitle={t('redCrescents.createSubtitle')} />
      <RedCrescentForm
        initial={
          provinceId || initialCityId
            ? {
                id: '',
                name: '',
                phone: null,
                address: null,
                neshanAddress: null,
                latitude: null,
                longitude: null,
                description: null,
                provinceId,
                cityId: initialCityId,
                province: { id: provinceId, nameFa: '', nameEn: '', countryId: '' },
                city: { id: initialCityId, nameFa: '', nameEn: '', provinceId },
                createdAt: '',
                updatedAt: '',
              }
            : undefined
        }
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/red-crescents', payload)
          toast.success(t('redCrescents.created'))
          navigate(listTo)
        }}
      />
    </div>
  )
}
