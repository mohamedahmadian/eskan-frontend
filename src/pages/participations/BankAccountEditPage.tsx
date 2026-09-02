import { Landmark } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { BankAccount } from '../../types/app'
import { BankAccountForm } from './BankAccountForm'

export function BankAccountEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['bank-account', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<BankAccount>(`/bank-accounts/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('bankAccounts.edit')}
        subtitle={<EntityNameSubtitle name={item.data.bankName} icon={Landmark} />}
      />
      <BankAccountForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/bank-accounts/${id}`, payload)
          toast.success(t('bankAccounts.updated'))
          navigate(`/participations/bank-accounts/${id}`)
        }}
      />
    </div>
  )
}
