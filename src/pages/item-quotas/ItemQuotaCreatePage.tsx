import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Supplier } from '../../types/app'
import { ItemQuotaForm } from './ItemQuotaForm'

export function ItemQuotaCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const suppliers = useQuery({
    queryKey: ['suppliers', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Supplier[]>('/suppliers')
      return data
    },
  })

  if (!suppliers.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('itemQuotas.create')} subtitle={t('itemQuotas.createSubtitle')} />
      <ItemQuotaForm
        suppliers={suppliers.data}
        onSubmit={async (payload) => {
          await api.post('/item-quotas', payload)
          toast.success(t('itemQuotas.created'))
          navigate('/logistics/item-quotas')
        }}
      />
    </div>
  )
}
