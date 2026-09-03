import { Milestone } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country, Province, WalkingStation } from '../../types/app'
import { WalkingStationForm } from './WalkingStationForm'
import { walkingStationBasePath } from './walkingStationPaths'

export function WalkingStationEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const basePath = walkingStationBasePath(pathname)
  const item = useQuery({
    queryKey: ['walking-station', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<WalkingStation>(`/walking-stations/${id}`)
      return data
    },
  })
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const selectedProvinceId = provinceId ?? item.data?.city.provinceId ?? ''

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
      <PageHeader
        title={t('walkingStations.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Milestone} />}
      />
      <WalkingStationForm
        initial={item.data}
        provinces={provinces.data}
        cities={cities.data ?? []}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/walking-stations/${id}`, payload)
          toast.success(t('walkingStations.updated'))
          navigate(`${basePath}/${id}`)
        }}
      />
    </div>
  )
}
