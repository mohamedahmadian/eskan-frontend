import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Province } from '../../types/app'
import { FoodSupplierForm } from './FoodSupplierForm'

export function FoodSupplierCreatePage() {
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
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('foodSuppliers.create')} subtitle={t('foodSuppliers.createSubtitle')} />
      <FoodSupplierForm
        initialProvinceId={provinceId}
        initialCityId={initialCityId}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post('/food-suppliers', payload)
          toast.success(t('foodSuppliers.created'))
          const params = new URLSearchParams({
            provinceId: payload.provinceId,
            cityId: payload.cityId,
          }).toString()
          navigate(`/base-info/food-suppliers?${params}`)
        }}
      />
    </div>
  )
}
