import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { OrgUnitForm } from './OrgUnitForm'

export function OrgUnitCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('orgUnits.create')} subtitle={t('orgUnits.createSubtitle')} />
      <OrgUnitForm
        onSubmit={async (payload) => {
          await api.post('/org-units', payload)
          toast.success(t('orgUnits.created'))
          navigate('/headquarters/units')
        }}
      />
    </div>
  )
}
