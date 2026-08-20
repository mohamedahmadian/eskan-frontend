import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Supplier } from '../../types/app'
import { SupplierItemForm } from './SupplierItemForm'

export function SupplierItemCreatePage() {
  const { t } = useTranslation()
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const supplier = useQuery({
    queryKey: ['supplier', supplierId],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/suppliers/${supplierId}`)
      return data
    },
  })

  if (!supplier.data || !supplierId) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('supplierItems.create')}
        subtitle={t('supplierItems.createSubtitle')}
      />
      <SupplierItemForm
        supplier={supplier.data}
        onSubmit={async (payload) => {
          await api.post('/supplier-items', payload)
          toast.success(t('supplierItems.created'))
          navigate(`/logistics/suppliers/${supplierId}/items`)
        }}
      />
    </div>
  )
}
