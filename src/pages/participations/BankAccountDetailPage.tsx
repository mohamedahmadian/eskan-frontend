import { Building2, CreditCard, Hash, Landmark, ToggleRight, WalletCards } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { BankAccount } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function BankAccountDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['bank-account', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<BankAccount>(`/bank-accounts/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('bankAccounts.details')}
        subtitle={<EntityNameSubtitle name={item.bankName} icon={Landmark} />}
      />
      <FormCard icon={Landmark} title={item.bankName}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={Building2} label={t('bankAccounts.bankName')} value={item.bankName} tone="teal" />
            <FormFactTile
              icon={Hash}
              label={t('bankAccounts.accountNumber')}
              copyValue={item.accountNumber}
              value={item.accountNumber}
              tone="mint"
            />
            <FormFactTile
              icon={CreditCard}
              label={t('bankAccounts.cardNumber')}
              copyValue={item.cardNumber}
              value={item.cardNumber || '—'}
              tone="ink"
            />
            <FormFactTile
              icon={WalletCards}
              label={t('bankAccounts.iban')}
              copyValue={item.iban}
              value={item.iban}
              tone="teal"
            />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="mint"
            />
          </div>
          <DetailActions
            editTo={`/participations/bank-accounts/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('bankAccounts.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('bankAccounts.confirmDelete'),
                successMessage: t('bankAccounts.deleted'),
                path: `/bank-accounts/${item.id}`,
                queryKey: ['bank-accounts'],
                onDeleted: () => navigate('/participations/bank-accounts'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
