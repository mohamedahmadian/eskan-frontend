import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { GovernmentOrganizationForm } from './GovernmentOrganizationForm'

export function GovernmentOrganizationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('governmentOrganizations.create')}
        subtitle={t('governmentOrganizations.createSubtitle')}
      />
      <GovernmentOrganizationForm
        onSubmit={async (payload) => {
          await api.post('/government-organizations', payload)
          toast.success(t('governmentOrganizations.created'))
          navigate('/base-info/government-organizations')
        }}
      />
    </div>
  )
}
