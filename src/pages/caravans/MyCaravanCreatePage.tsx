import { Tent } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { Caravan, City, Country, Province } from '../../types/app'
import { useCaravanCreateQuota } from './caravan-create-quota'
import { CaravanForm } from './CaravanForm'

export function MyCaravanCreatePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const quota = useCaravanCreateQuota()
  const [countryId, setCountryId] = useState('')
  const [provinceId, setProvinceId] = useState('')

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''
  const selectedCountryId = countryId || user?.countryId || iranId

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
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })

  if (!countries.data || !user || quota.isLoading) {
    return <LoadingState />
  }

  if (quota.data && !quota.data.allowed) {
    return (
      <div className={formShellClassName}>
        <PageHeader
          icon={Tent}
          title={t('caravans.create')}
          subtitle={t('myCaravans.createSubtitle')}
        />
        <p className="rounded-[22px] border border-teal-100 bg-white px-5 py-4 text-sm leading-7 text-ink-700 shadow-[0_8px_20px_rgba(20,40,40,0.04)]">
          {t('caravans.maxPerNationalIdReached', {
            max: formatNumber(quota.data.max, locale),
            year: formatNumber(quota.data.year, locale),
          })}
        </p>
      </div>
    )
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Tent}
        title={t('caravans.create')} subtitle={t('myCaravans.createSubtitle')} />
      <CaravanForm
        initialCountryId={selectedCountryId}
        initialProvinceId={provinceId}
        countries={countries.data}
        provinces={provinces.data ?? []}
        cities={cities.data ?? []}
        selectManager={false}
        currentUserId={user.id}
        defaultCountryId={user.countryId || iranId}
        defaultProvinceId={user.provinceId}
        defaultCityId={user.cityId}
        onCountryChange={setCountryId}
        onProvinceChange={setProvinceId}
        onSubmit={async (payload) => {
          await api.post<Caravan>('/caravans', payload)
          await refresh()
          toast.success(t('caravans.created'))
          navigate('/my-caravans')
        }}
      />
    </div>
  )
}
