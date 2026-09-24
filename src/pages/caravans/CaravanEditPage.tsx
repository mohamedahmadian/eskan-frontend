import { Tent } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Caravan, City, Country, Province } from '../../types/app'
import { CaravanForm } from './CaravanForm'

export function CaravanEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fromMine = useLocation().pathname.startsWith('/my-caravans')
  const listPath = fromMine ? '/my-caravans' : '/caravans'
  const item = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })
  const [countryId, setCountryId] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const selectedCountryId = countryId ?? item.data?.city?.province?.countryId ?? ''
  const selectedProvinceId = provinceId ?? item.data?.city?.provinceId ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', selectedCountryId],
    enabled: Boolean(selectedCountryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: selectedCountryId, activeOnly: true },
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

  if (!item.data || !countries.data || (fromMine && !user)) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        icon={Tent}
        title={t('caravans.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Tent} />}
      />
      <CaravanForm
        initial={item.data}
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        selectManager={!fromMine}
        currentUserId={fromMine ? user?.id : undefined}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/caravans/${id}`, payload)
          toast.success(t('caravans.updated'))
          navigate(`${listPath}/${id}`)
        }}
      />
    </div>
  )
}
