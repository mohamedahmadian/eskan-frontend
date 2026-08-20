import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ItemQuota, ItemQuotaVoucher, ManagedUser, Supplier } from '../../types/app'
import { ItemQuotaVoucherForm } from './ItemQuotaVoucherForm'
import { voucherDetailPath } from './voucher-paths'

export function ItemQuotaVoucherEditPage() {
  const { t } = useTranslation()
  const { quotaId: quotaIdParam, id } = useParams()
  const navigate = useNavigate()

  const item = useQuery({
    queryKey: ['item-quota-voucher', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ItemQuotaVoucher>(`/item-quota-vouchers/${id}`)
      return data
    },
  })
  const quotaId = quotaIdParam ?? item.data?.quotaId
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

  if (!item.data || !quota.data || !managers.data || !suppliers.data || !id) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('itemQuotaVouchers.edit')} subtitle={t('itemQuotaVouchers.editSubtitle')} />
      <ItemQuotaVoucherForm
        quota={quota.data}
        managers={managers.data}
        suppliers={suppliers.data}
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/item-quota-vouchers/${id}`, payload)
          toast.success(t('itemQuotaVouchers.updated'))
          navigate(voucherDetailPath(id, quotaIdParam))
        }}
      />
    </div>
  )
}
