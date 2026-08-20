import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { SupplierItem } from '../../types/app'
import { SupplierItemForm } from './SupplierItemForm'

export function SupplierItemEditPage() {
  const { t } = useTranslation()
  const { supplierId, id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['supplier-item', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SupplierItem>(`/supplier-items/${id}`)
      return data
    },
  })

  if (!item.data || !supplierId) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('supplierItems.edit')} subtitle={t('supplierItems.editSubtitle')} />
      <SupplierItemForm
        supplier={item.data.supplier}
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/supplier-items/${id}`, payload)
          toast.success(t('supplierItems.updated'))
          navigate(`/logistics/suppliers/${supplierId}/items/${id}`)
        }}
      />
    </div>
  )
}
