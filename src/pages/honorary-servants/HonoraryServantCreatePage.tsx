import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { HonoraryServantForm } from './HonoraryServantForm'

export function HonoraryServantCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('honoraryServants.create')}
        subtitle={t('honoraryServants.createSubtitle')}
      />
      <HonoraryServantForm
        onSubmit={async (payload) => {
          await api.post('/honorary-servants', payload)
          toast.success(t('honoraryServants.created'))
          navigate('/honorary-servants')
        }}
      />
    </div>
  )
}
