import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { SupplierForm } from './SupplierForm'

export function SupplierCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('suppliers.create')} subtitle={t('suppliers.createSubtitle')} />
      <SupplierForm
        onSubmit={async (payload) => {
          await api.post('/suppliers', payload)
          toast.success(t('suppliers.created'))
          navigate('/logistics/suppliers')
        }}
      />
    </div>
  )
}
