import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useAuth } from '../../auth/AuthProvider'
import { api, getApiErrorMessage } from '../../lib/api'
import { isCaravanManager } from '../../lib/roles'
import type { ManagedUser } from '../../types/app'
import { UserLocationForm } from './UserLocationForm'

export function MyLocationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>('/account')
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('location.register')} backTo={false} />
      <UserLocationForm
        initial={query.data}
        showWalkingRoute={isCaravanManager(user)}
        onCancel={() => navigate('/')}
        onSubmit={async (payload) => {
          try {
            await api.patch('/account/location', payload)
            toast.success(t('location.saved'))
            await query.refetch()
            navigate('/')
          } catch (error) {
            toast.error(getApiErrorMessage(error, t('common.error')))
          }
        }}
      />
    </div>
  )
}
