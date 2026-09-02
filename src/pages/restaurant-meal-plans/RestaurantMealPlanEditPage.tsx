import { CalendarRange } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Food, Restaurant, RestaurantMealPlan } from '../../types/app'
import { RestaurantMealPlanForm } from './RestaurantMealPlanForm'

export function RestaurantMealPlanEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['restaurant-meal-plan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RestaurantMealPlan>(`/restaurant-meal-plans/${id}`)
      return data
    },
  })

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

  if (!item.data || !restaurants.data || !foods.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('restaurantMealPlans.edit')}
        subtitle={<EntityNameSubtitle name={item.data.food.name} icon={CalendarRange} />}
      />
      <RestaurantMealPlanForm
        initial={item.data}
        restaurants={restaurants.data}
        foods={foods.data}
        onSubmit={async (payload) => {
          await api.patch(`/restaurant-meal-plans/${id}`, payload)
          toast.success(t('restaurantMealPlans.updated'))
          navigate(`/logistics/restaurant-meal-plans/${id}`)
        }}
      />
    </div>
  )
}
