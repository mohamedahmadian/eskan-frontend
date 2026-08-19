import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Province, RedCrescent } from '../../types/app'
import { RedCrescentForm } from './RedCrescentForm'

export function RedCrescentEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['red-crescent', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RedCrescent>(`/red-crescents/${id}`)
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
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('redCrescents.edit')} subtitle={t('redCrescents.editSubtitle')} />
      <RedCrescentForm
        initial={item.data}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/red-crescents/${id}`, payload)
          toast.success(t('redCrescents.updated'))
          navigate(`/base-info/red-crescents/${id}`)
        }}
      />
    </div>
  )
}
