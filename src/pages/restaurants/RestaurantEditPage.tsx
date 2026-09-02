import { CookingPot } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Restaurant } from '../../types/app'
import { RestaurantForm } from './RestaurantForm'

export function RestaurantEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['restaurant', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Restaurant>(`/restaurants/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('restaurants.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={CookingPot} />}
      />
      <RestaurantForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/restaurants/${id}`, payload)
          toast.success(t('restaurants.updated'))
          navigate(`/logistics/restaurants/${id}`)
        }}
      />
    </div>
  )
}
