import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { currentPersianYear } from '../../lib/datetime'
import type { ManagedUser, SupplierItem } from '../../types/app'
import { AccommodationLoanForm } from './AccommodationLoanForm'

export function AccommodationLoanCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const year = currentPersianYear()

  const items = useQuery({
    queryKey: ['supplier-items', 'lookup', year],
    queryFn: async () => {
      const { data } = await api.get<SupplierItem[]>('/supplier-items', {
        params: { year },
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

  if (!items.data || !managers.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('accommodationLoans.create')}
        subtitle={t('accommodationLoans.createSubtitle')}
      />
      <AccommodationLoanForm
        items={items.data}
        managers={managers.data}
        onSubmit={async (payload) => {
          await api.post('/accommodation-loans', payload)
          toast.success(t('accommodationLoans.created'))
          navigate('/logistics/loans')
        }}
      />
    </div>
  )
}
