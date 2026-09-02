import { Wheat } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Ingredient } from '../../types/app'
import { IngredientForm } from './IngredientForm'

export function IngredientEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const item = useQuery({
    queryKey: ['ingredient', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Ingredient>(`/ingredients/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('ingredients.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Wheat} />}
      />
      <IngredientForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/ingredients/${id}`, payload)
          await queryClient.invalidateQueries({ queryKey: ['foods'] })
          toast.success(t('ingredients.updated'))
          navigate(`/logistics/ingredients/${id}`)
        }}
      />
    </div>
  )
}
