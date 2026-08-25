import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, EntityNameSubtitle, userFormShellClassName } from '../../components/ui/Form'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { isAdmin } from '../../lib/roles'
import type { Accommodation, City, Country, ManagedUser, Province } from '../../types/app'
import { AccommodationForm } from './AccommodationForm'

export function AccommodationEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const fromMine = useLocation().pathname.startsWith('/my-accommodations')
  const listPath = fromMine ? '/my-accommodations' : '/accommodations'
  const { user } = useAuth()
  const admin = isAdmin(user)
  const item = useQuery({
    queryKey: ['accommodation', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Accommodation>(`/accommodations/${id}`)
      return data
    },
  })
  const [countryId, setCountryId] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const selectedCountryId = countryId ?? item.data?.countryId ?? ''
  const selectedProvinceId = provinceId ?? item.data?.provinceId ?? ''

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
  const users = useQuery({
    queryKey: ['users', 'lookup', 'ACCOMMODATION_MANAGER'],
    enabled: admin,
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'ACCOMMODATION_MANAGER' },
      })
      return data
    },
  })

  if (!item.data || !countries.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('accommodations.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Building2} />}
      />
      <AccommodationForm
        initial={item.data}
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        users={users.data ?? []}
        isAdmin={admin}
        currentUserId={user?.id}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/accommodations/${id}`, payload)
          toast.success(t('accommodations.updated'))
          navigate(listPath)
        }}
      />
    </div>
  )
}
