import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ItemQuota, ManagedUser, Supplier } from '../../types/app'
import { ItemQuotaVoucherForm } from './ItemQuotaVoucherForm'

export function IssueVoucherPage({
  titleKey = 'menus.issueVoucher',
  subtitleKey = 'itemQuotaVouchers.standaloneSubtitle',
  successPath,
}: {
  titleKey?: string
  subtitleKey?: string
  successPath?: (id: string, quotaId: string) => string
} = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const quotas = useQuery({
    queryKey: ['item-quotas', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ItemQuota[]>('/item-quotas')
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

  if (!quotas.data || !managers.data || !suppliers.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t(titleKey)} subtitle={t(subtitleKey)} />
      <ItemQuotaVoucherForm
        quotas={quotas.data}
        managers={managers.data}
        suppliers={suppliers.data}
        onSubmit={async (payload) => {
          const { data } = await api.post<{ id: string }>('/item-quota-vouchers', payload)
          toast.success(t('itemQuotaVouchers.created'))
          navigate(
            successPath
              ? successPath(data.id, payload.quotaId)
              : `/logistics/item-quotas/${payload.quotaId}/vouchers/${data.id}`,
          )
        }}
      />
    </div>
  )
}
