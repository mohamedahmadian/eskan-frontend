import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { CaravanForm } from './CaravanForm'

export function CaravanCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('caravans.create')} subtitle={t('caravans.createSubtitle')} />
      <CaravanForm
        onSubmit={async (payload) => {
          await api.post('/caravans', payload)
          toast.success(t('caravans.created'))
          navigate('/caravans')
        }}
      />
    </div>
  )
}
