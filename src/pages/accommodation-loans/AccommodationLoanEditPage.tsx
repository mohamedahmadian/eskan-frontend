import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { AccommodationLoan, ManagedUser, SupplierItem } from '../../types/app'
import { AccommodationLoanForm } from './AccommodationLoanForm'

export function AccommodationLoanEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['accommodation-loan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<AccommodationLoan>(`/accommodation-loans/${id}`)
      return data
    },
  })

  const items = useQuery({
    queryKey: ['supplier-items', 'lookup', item.data?.supplierItem.year],
    enabled: Boolean(item.data),
    queryFn: async () => {
      const { data } = await api.get<SupplierItem[]>('/supplier-items', {
        params: { year: item.data?.supplierItem.year },
      })
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

  if (!item.data || !items.data || !managers.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('accommodationLoans.edit')} subtitle={t('accommodationLoans.editSubtitle')} />
      <AccommodationLoanForm
        initial={item.data}
        items={items.data}
        managers={managers.data}
        onSubmit={async (payload) => {
          await api.patch(`/accommodation-loans/${id}`, payload)
          toast.success(t('accommodationLoans.updated'))
          navigate('/logistics/loans')
        }}
      />
    </div>
  )
}
