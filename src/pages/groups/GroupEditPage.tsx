import { UsersRound } from 'lucide-react'
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
import type { City, Country, Group, Province } from '../../types/app'
import { GroupForm } from './GroupForm'

export function GroupEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const fromMine = useLocation().pathname.startsWith('/my-groups')
  const listPath = fromMine ? '/my-groups' : '/groups'
  const item = useQuery({
    queryKey: ['group', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Group>(`/groups/${id}`)
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

  if (!item.data || !countries.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('groups.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={UsersRound} />}
      />
      <GroupForm
        initial={item.data}
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.patch(`/groups/${id}`, payload)
          toast.success(t('groups.updated'))
          navigate(`${listPath}/${id}`)
        }}
      />
    </div>
  )
}
