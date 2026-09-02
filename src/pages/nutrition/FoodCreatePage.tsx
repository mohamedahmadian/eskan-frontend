import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Ingredient } from '../../types/app'
import { FoodForm } from './FoodForm'

export function FoodCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ingredients = useQuery({
    queryKey: ['ingredients', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Ingredient[]>('/ingredients')
      return data
    },
  })

  if (!ingredients.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t('foods.create')} subtitle={t('foods.createSubtitle')} />
      <FoodForm
        ingredients={ingredients.data}
        onSubmit={async (payload) => {
          await api.post('/foods', payload)
          toast.success(t('foods.created'))
          navigate('/logistics/foods')
        }}
      />
    </div>
  )
}
