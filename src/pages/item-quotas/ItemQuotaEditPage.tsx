import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ItemQuota, Supplier } from '../../types/app'
import { ItemQuotaForm } from './ItemQuotaForm'

export function ItemQuotaEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['item-quota', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ItemQuota>(`/item-quotas/${id}`)
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

  if (!item.data || !suppliers.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('itemQuotas.edit')} subtitle={t('itemQuotas.editSubtitle')} />
      <ItemQuotaForm
        initial={item.data}
        suppliers={suppliers.data}
        onSubmit={async (payload) => {
          await api.patch(`/item-quotas/${id}`, payload)
          toast.success(t('itemQuotas.updated'))
          navigate(`/logistics/item-quotas/${id}`)
        }}
      />
    </div>
  )
}
