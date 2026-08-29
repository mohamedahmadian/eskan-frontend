import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { PlaceTypeForm } from './PlaceTypeForm'

export function PlaceTypeCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('placeTypes.create')} subtitle={t('placeTypes.createSubtitle')} />
      <PlaceTypeForm
        onSubmit={async (payload) => {
          await api.post('/place-types', payload)
          toast.success(t('placeTypes.created'))
          navigate('/base-info/places/types')
        }}
      />
    </div>
  )
}
