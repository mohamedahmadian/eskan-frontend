import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country, EntryBorder } from '../../types/app'
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

  const entryBorders = useQuery({
    queryKey: ['entry-borders', 'lookup', 'active'],
    queryFn: async () => {
      const { data } = await api.get<EntryBorder[]>('/entry-borders', {
        params: { activeOnly: true },
      })
      return data
    },
  })

  if (!countries.data || !iranCities.data || !entryBorders.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t('walkingRoutes.create')} subtitle={t('walkingRoutes.createSubtitle')} />
      <WalkingRouteForm
        countries={countries.data}
        iranCities={iranCities.data}
        entryBorders={entryBorders.data}
        onSubmit={async (payload) => {
          await api.post('/walking-routes', payload)
          toast.success(t('walkingRoutes.created'))
          navigate('/base-info/walking-routes')
        }}
      />
    </div>
  )
}
