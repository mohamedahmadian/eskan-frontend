import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Supplier } from '../../types/app'
import { SupplierForm } from './SupplierForm'

export function SupplierEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['supplier', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/suppliers/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('suppliers.edit')} subtitle={t('suppliers.editSubtitle')} />
      <SupplierForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/suppliers/${id}`, payload)
          toast.success(t('suppliers.updated'))
          navigate(`/logistics/suppliers/${id}`)
        }}
      />
    </div>
  )
}
