import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Food, Restaurant } from '../../types/app'
import { RestaurantMealPlanForm } from './RestaurantMealPlanForm'

export function RestaurantMealPlanCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const restaurantId = searchParams.get('restaurantId') ?? ''

  const restaurants = useQuery({
    queryKey: ['restaurants', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Restaurant[]>('/restaurants')
      return data
    },
  })

  const foods = useQuery({
    queryKey: ['foods', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Food[]>('/foods')
      return data
    },
  })

  if (!restaurants.data || !foods.data) {
    return <LoadingState />
  }

  const listQuery = restaurantId ? `?restaurantId=${restaurantId}` : ''

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('restaurantMealPlans.create')}
        subtitle={t('restaurantMealPlans.createSubtitle')}
      />
      <RestaurantMealPlanForm
        restaurants={restaurants.data}
        foods={foods.data}
        defaultRestaurantId={restaurantId || undefined}
        onSubmit={async (payload) => {
          await api.post('/restaurant-meal-plans', payload)
          toast.success(t('restaurantMealPlans.created'))
          navigate(`/logistics/restaurant-meal-plans${listQuery}`)
        }}
      />
    </div>
  )
}
