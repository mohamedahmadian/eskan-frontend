import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country } from '../../types/app'
import { WalkingRouteForm } from './WalkingRouteForm'

export function WalkingRouteCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''
  const iranCities = useQuery({
    queryKey: ['cities', 'lookup', 'IR', iranId],
    enabled: Boolean(iranId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { countryId: iranId, activeOnly: true },
      })
      return data
    },
  })

  if (!countries.data || !iranCities.data) {
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('walkingRoutes.create')} subtitle={t('walkingRoutes.createSubtitle')} />
      <WalkingRouteForm
        countries={countries.data}
        iranCities={iranCities.data}
        onSubmit={async (payload) => {
          await api.post('/walking-routes', payload)
          toast.success(t('walkingRoutes.created'))
          navigate('/base-info/walking-routes')
        }}
      />
    </div>
  )
}
