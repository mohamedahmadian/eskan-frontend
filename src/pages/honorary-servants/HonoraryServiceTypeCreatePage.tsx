import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { HonoraryServiceTypeForm } from './HonoraryServiceTypeForm'

export function HonoraryServiceTypeCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('honoraryServiceTypes.create')}
        subtitle={t('honoraryServiceTypes.createSubtitle')}
      />
      <HonoraryServiceTypeForm
        onSubmit={async (payload) => {
          await api.post('/honorary-service-types', payload)
          toast.success(t('honoraryServiceTypes.created'))
          navigate('/honorary-service-types')
        }}
      />
    </div>
  )
}
