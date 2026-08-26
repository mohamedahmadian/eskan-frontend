import { Route } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, EntityNameSubtitle, userFormShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { City, Country, EntryBorder, WalkingRoute } from '../../types/app'
import { WalkingRouteForm } from './WalkingRouteForm'

export function WalkingRouteEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const item = useQuery({
    queryKey: ['walking-route', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<WalkingRoute>(`/walking-routes/${id}`)
      return data
    },
  })

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
    queryKey: ['entry-borders', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<EntryBorder[]>('/entry-borders')
      return data
    },
  })

  if (!item.data || !countries.data || !iranCities.data || !entryBorders.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('walkingRoutes.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Route} />}
      />
      <WalkingRouteForm
        initial={item.data}
        countries={countries.data}
        iranCities={iranCities.data}
        entryBorders={entryBorders.data}
        onSubmit={async (payload) => {
          await api.patch(`/walking-routes/${id}`, payload)
          toast.success(t('walkingRoutes.updated'))
          navigate(`/base-info/walking-routes/${id}`)
        }}
      />
    </div>
  )
}
