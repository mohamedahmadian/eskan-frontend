import { UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { isCaravanManager } from '../../lib/roles'
import type { ManagedUser } from '../../types/app'
import type { RoleUserScope } from '../users/user-scopes'
import { UserLocationForm } from './UserLocationForm'

export function RoleUserLocationPage({ scope }: { scope: RoleUserScope }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: [scope.queryKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`${scope.apiBase}/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('location.register')}
        subtitle={<EntityNameSubtitle name={query.data.fullName} icon={UserRound} />}
      />
      <UserLocationForm
        initial={query.data}
        showWalkingRoute={isCaravanManager(query.data)}
        routeUserId={query.data.id}
        onCancel={() => navigate(`${scope.listPath}/${id}`)}
        onSubmit={async (payload) => {
          try {
            await api.patch(`${scope.apiBase}/${id}/location`, payload)
            toast.success(t('location.saved'))
            navigate(`${scope.listPath}/${id}`)
          } catch (error) {
            toast.error(getApiErrorMessage(error, t('common.error')))
          }
        }}
      />
    </div>
  )
}
