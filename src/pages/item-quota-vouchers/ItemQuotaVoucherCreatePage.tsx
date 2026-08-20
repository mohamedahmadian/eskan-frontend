import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ItemQuota, ManagedUser, Supplier } from '../../types/app'
import { ItemQuotaVoucherForm } from './ItemQuotaVoucherForm'

export function ItemQuotaVoucherCreatePage() {
  const { t } = useTranslation()
  const { quotaId } = useParams()
  const navigate = useNavigate()

  const quota = useQuery({
    queryKey: ['item-quota', quotaId],
    enabled: Boolean(quotaId),
    queryFn: async () => {
      const { data } = await api.get<ItemQuota>(`/item-quotas/${quotaId}`)
      return data
    },
  })
  const managers = useQuery({
    queryKey: ['users', 'lookup', 'ACCOMMODATION_MANAGER'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'ACCOMMODATION_MANAGER' },
      })
      return data
    },
  })
  const suppliers = useQuery({
    queryKey: ['suppliers', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Supplier[]>('/suppliers')
      return data
    },
  })

  if (!quota.data || !managers.data || !suppliers.data || !quotaId) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('itemQuotaVouchers.create')}
        subtitle={t('itemQuotaVouchers.createSubtitle')}
      />
      <ItemQuotaVoucherForm
        quota={quota.data}
        managers={managers.data}
        suppliers={suppliers.data}
        onSubmit={async (payload) => {
          const { data } = await api.post<{ id: string }>('/item-quota-vouchers', payload)
          toast.success(t('itemQuotaVouchers.created'))
          navigate(`/logistics/item-quotas/${quotaId}/vouchers/${data.id}`)
        }}
      />
    </div>
  )
}
