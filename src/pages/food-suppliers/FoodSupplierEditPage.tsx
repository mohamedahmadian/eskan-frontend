import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, FoodSupplier, Province } from '../../types/app'
import { FoodSupplierForm } from './FoodSupplierForm'

export function FoodSupplierEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['food-supplier', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<FoodSupplier>(`/food-suppliers/${id}`)
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

  if (!item.data || !provinces.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('foodSuppliers.edit')} subtitle={t('foodSuppliers.editSubtitle')} />
      <FoodSupplierForm
        initial={item.data}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/food-suppliers/${id}`, payload)
          toast.success(t('foodSuppliers.updated'))
          navigate(`/base-info/food-suppliers/${id}`)
        }}
      />
    </div>
  )
}
