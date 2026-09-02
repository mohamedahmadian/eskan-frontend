import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { BankAccountForm } from './BankAccountForm'

export function BankAccountCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('bankAccounts.create')} subtitle={t('bankAccounts.createSubtitle')} />
      <BankAccountForm
        onSubmit={async (payload) => {
          await api.post('/bank-accounts', payload)
          toast.success(t('bankAccounts.created'))
          navigate('/participations/bank-accounts')
        }}
      />
    </div>
  )
}
