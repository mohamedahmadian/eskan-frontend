import { HandHeart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { SupportRequestForm } from './SupportRequestForm'

export function SupportRequestCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={HandHeart}
        title={t('supportRequests.create')}
        subtitle={t('supportRequests.createSubtitle')}
      />
      <SupportRequestForm
        onSubmit={async (payload) => {
          await api.post('/support-requests', payload)
          toast.success(t('supportRequests.created'))
          navigate('/support-requests')
        }}
      />
    </div>
  )
}
