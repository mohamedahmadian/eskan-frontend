import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { IngredientForm } from './IngredientForm'

export function IngredientCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('ingredients.create')} subtitle={t('ingredients.createSubtitle')} />
      <IngredientForm
        onSubmit={async (payload) => {
          await api.post('/ingredients', payload)
          toast.success(t('ingredients.created'))
          navigate('/logistics/ingredients')
        }}
      />
    </div>
  )
}
