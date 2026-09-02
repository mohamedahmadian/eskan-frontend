import { UtensilsCrossed } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Food, Ingredient } from '../../types/app'
import { FoodForm } from './FoodForm'

export function FoodEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['food', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Food>(`/foods/${id}`)
      return data
    },
  })
  const ingredients = useQuery({
    queryKey: ['ingredients', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Ingredient[]>('/ingredients')
      return data
    },
  })

  if (!item.data || !ingredients.data) {
    return <LoadingState />
  }

  const lookup = [...ingredients.data]
  for (const line of item.data.ingredients) {
    if (!lookup.some((ingredient) => ingredient.id === line.ingredient.id)) {
      lookup.unshift({
        ...line.ingredient,
        foodsCount: 0,
        createdAt: '',
        updatedAt: '',
      })
    }
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('foods.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={UtensilsCrossed} />}
      />
      <FoodForm
        initial={item.data}
        ingredients={lookup}
        onSubmit={async (payload) => {
          await api.patch(`/foods/${id}`, payload)
          toast.success(t('foods.updated'))
          navigate(`/logistics/foods/${id}`)
        }}
      />
    </div>
  )
}
